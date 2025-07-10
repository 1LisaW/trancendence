'use strict'

import fastify from "fastify";
import { AUTH_ServerErrorDTO, Auth_UserDTO, AuthUserErrorDTO, delete_user_from_matchmaking, get_user__auth, get_user_profile_avatar, post_bat_move__game_service, post_score_data, post_terminate_game, ScoreRequestBody } from "./api";
import { GAME_MODE, GameLoopParams, GameResult, GameState, ScoreState, Status, WSocket } from "./model";
import { Users } from "./Users";
import { Tournament } from "./Tournament";
import TournamentSessionManager from "./tournament/TournamentSessionManager";

// Simona Addition - Track AI WebSocket connections by gameId
const aiSockets: Map<string, WSocket> = new Map(); // stores a map of AI sockets by gameId

const users = new Users();
const tournamentSessionManager = new TournamentSessionManager(users);
// const tournament = new Tournament(users);

const Fastify = fastify();
Fastify.register(require('@fastify/websocket'));
Fastify.register(async function (fastify) {

  // GAME:
  // http: gameLoop data from game-service
  Fastify.post<{ Params: GameLoopParams, Body: GameState | ScoreState | GameResult }>('/game/:gameId', (request, reply) => {
    const { gameId } = request.params;
    const { players } = request.body;
    
    // Check if human players have alive sockets (skip AI)
    const humanPlayers = players.filter(p => p !== -1);
    if (humanPlayers.every(player => users.gameSocketIsAlive(player))) {
      // Send to human players (only if they're alive)
      humanPlayers.forEach(player => {
        if (users.gameSocketIsAlive(player)) {
          const sockets = users.getGameSocketById(player);
          if (sockets && sockets.length)
            sockets.forEach(socket => socket.send(JSON.stringify(request.body)));
        }
      })

      // Simona - Send to AI if it's a PVC game - use the correct socket for this game
      if (players.includes(-1)) {
        const aiSocketForThisGame = aiSockets.get(gameId);
        if (aiSocketForThisGame && (aiSocketForThisGame as any).readyState === 1) { // WebSocket.OPEN
          aiSocketForThisGame.send(JSON.stringify(request.body));
        }
      }

      if ("gameResult" in request.body) {
        const { score } = request.body;
        const data: ScoreRequestBody = {
          first_user_id: players[0],
          second_user_id: players[1],
          first_user_name: users.getUserNameById(players[0]) || '',
          second_user_name: users.getUserNameById(players[1]) || '',
          score: score,
          game_mode: players.includes(-1) ? 'pvc' : 'pvp'
        };
        post_score_data(data);
      }
      reply.code(200).send({ message: "Message received" });
      return;
    }
    // Simona - Only send to human players
    humanPlayers.forEach((player, id) => {
      if (users.gameSocketIsAlive(player))
      {
        const sockets = users.getGameSocketById(player);
        if (sockets && sockets.length)
          sockets.forEach(socket => socket
            .send(JSON.stringify({ message: `${users.getUserNameById(players[(1-id)])} leave the room` })));
      }
    })
    // Modified by Simona - Actually terminate the game when players disconnect
    console.log(`Terminating game ${gameId} due to player disconnection`);
    post_terminate_game(gameId).catch(err => console.log('Failed to terminate game:', err));
    
    // Simona - Notify AI service that game ended if this was a PVC game
    if (players.includes(-1)) {
      const aiSocketForThisGame = aiSockets.get(gameId);
      if (aiSocketForThisGame && (aiSocketForThisGame as any).readyState === 1) {
          aiSocketForThisGame.send(JSON.stringify({ 
              message: "Game terminated - player disconnected",
              gameId: gameId 
          }));
      }
    }
    
    reply.code(200).send({ message: "Message received" });
  })

  //ws:
  Fastify.get('/game', { websocket: true }, async (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {
    const token = req.headers['sec-websocket-protocol'] || '';
    
    // Simona - Addition */ Handle AI service connection (ONE PER GAME)
    if (token === 'AI_SERVICE_TOKEN') {
      socket.id = -1; // AI player ID

      // Wait for the first message to get the gameId, then store the socket
      socket.once('message', (message) => {
          try {
              const msg = JSON.parse(message.toString());
              if ('gameId' in msg) {
                  aiSockets.set(msg.gameId, socket);
                  console.log(`AI service connected for game ${msg.gameId}`);
              }
          } catch (e) {
              console.error('Failed to parse AI connection message:', e);
          }
      });

      socket.on('message', async message => {
          try {
              const msg = JSON.parse(message.toString());
              // Handle AI moves - forward to game-service just like human moves
              if ('gameId' in msg && 'step' in msg) {
                  const { gameId, step } = msg;
                  console.log(`🔍 FORWARDING AI MOVE: gameId=${gameId}, step=${step}, playerId=-1`);
                  const response = await post_bat_move__game_service(gameId, -1, step);
                  console.log(`🔍 AI MOVE RESPONSE:`, response.status);
              }
          } catch (error) {
              console.error('Error handling AI message:', error);
          }
      });

      socket.on('close', () => {
          // Simona - Remove this socket from all gameIds it was associated with
          for (const [gameId, s] of aiSockets.entries()) {
              if (s === socket) {
                  aiSockets.delete(gameId);
                  console.log(`AI service disconnected for game ${gameId}`);
              }
          }
      });

      return; // Skip normal user auth for AI
    }
    
    let userData = await users.addUser(token);

    if ('user' in userData) {
      userData = userData as Auth_UserDTO;
      const user_id = userData.user.id;
      socket.id = user_id;

      users.addGameSocket(user_id, socket);
    }
    else if ('error' in userData) {
      socket.close();
    }

    socket.on('message', async message => {

      const user_id = socket.id;
      if (user_id === undefined)
        return;

      const msg = JSON.parse(message.toString());

      // message to withdraw from waiting queue
      if ('matchmaking' in msg && msg.matchmaking === false) {
        users.removeUserFromMatchmaking(user_id);
      }

      // message for matchmaking
      else if ('mode' in msg) {
        const mode = msg.mode as GAME_MODE;
        if (mode === GAME_MODE.PVP || mode === GAME_MODE.PVC) {

          const data = await users.matchmaking(user_id, socket, mode);
          const json = await data.json();

          if ('gameId' in json) {
            const gameUsers: number[] = json.users;
            const opponentNames = [users.getUserNameById(gameUsers[1]), users.getUserNameById(gameUsers[0])];
            console.log("opponentNames: ", opponentNames);

            const avatars = await Promise.all(opponentNames.map((name) => get_user_profile_avatar(name || '')));
            gameUsers.forEach((gameSocketId, id) => {
              console.log(`🔍 DEBUG: gameSocketId=${gameSocketId}, id=${id}, gameUsers=${JSON.stringify(gameUsers)}`);
              // Simona - Skip AI player for status and socket operations
              if (gameSocketId !== -1) {
                const correctOrder = mode === GAME_MODE.PVC ? 1 : id;
                const reply = {
                  gameId: json.gameId,
                  order: correctOrder,  
                  opponent: opponentNames[id],
                  avatars: [avatars[0].avatar, avatars[1].avatar]
                };
                users.setPlayingStateToUser(gameSocketId);
                users.getGameSocketById(gameSocketId)?.forEach(socket => socket.send(JSON.stringify(reply)));
              }
            });

            // Simona -Send game setup to AI if PVC mode
            if (mode === GAME_MODE.PVC) {
                const aiSocketForThisGame = aiSockets.get(json.gameId);
                if (aiSocketForThisGame && (aiSocketForThisGame as any).readyState === 1) { // WebSocket.OPEN
                    const aiReply = {
                        gameId: json.gameId,
                        order: 0,  // AI gets order 0 (left side)
                        opponent: 'Human',
                        avatars: [avatars[0].avatar, avatars[1].avatar]
                    };
                    (aiSocketForThisGame as any).send(JSON.stringify(aiReply));
                }
            }

            // Simona - Trigger AI to join this specific game
            if ('gameId' in json && mode === GAME_MODE.PVC) {
              fetch('http://ai-service:8086/join-game/' + json.gameId, {
                method: 'POST'
              }).catch(err => console.log('AI service unavailable:', err));
            }
          }
        }
      }
      // bat movements from frontend
      else if ('gameId' in msg) {
        const { gameId, step } = msg;
        post_bat_move__game_service(gameId, user_id, step);
      }
    });
    socket.on('close', () => {
      users.removeGameSocket(socket);
      
      // Game termination is handled by the game service when it detects disconnection
      // No need to notify AI here since we don't know which game the user was in
      
      console.log("Disconnected", socket.id);
    });
  })


  // CHAT:

  Fastify.get('/chat', { websocket: true }, async (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {
    const token = req.headers['sec-websocket-protocol'] || '';
    const userData = await users.addUser(token);
    console.log('/chat ws: ', userData);
    if ('user' in userData) {
      socket.id = userData.user.id;
      users.addChatUserSocket(userData.user.id, socket);

      tournamentSessionManager.onNewUserConnection(userData.user.id);
      // if (!tournament.isUserInTournament(userData.user.id)) {
      //   const invitation = {
      //     recipient: 'tournament',
      //     tournament_id: tournament.getTournamentId(),
      //     event: 'invite',
      //     time: Date.now()
      //   };
      //   socket.send(JSON.stringify(invitation));
      // }
    }

    else {
      socket.close();
    }

    socket.on('message', message => {
      console.log("From backend:", message.toString());
      const msg = JSON.parse(message.toString());
      const user_id = socket.id;
      if (user_id && 'recipient' in msg && 'event' in msg) {
        if (msg.recipient === 'tournament') {
          tournamentSessionManager.handleChatMessage(user_id, msg);
        }
      }
    });

    socket.on('close', () => {
      users.removeChatUserSocket(socket);
      socket.send('server socket is closed');
    });
  })
})



Fastify.listen({ port: 8082, host: '0.0.0.0' }, (err, address) => {
  console.log("Server started");
  if (err) {
    Fastify.log.error(err);
    console.log(err);
    process.exit(1);
  }
  console.log(`Server listening at: ${address}`);
})
