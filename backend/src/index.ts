'use strict'

import fastify from "fastify";
import { AUTH_ServerErrorDTO, Auth_UserDTO, AuthUserErrorDTO, delete_user_from_matchmaking, get_user__auth, get_user_profile_avatar, post_bat_move__game_service, post_score_data, post_terminate_game, ScoreRequestBody } from "./api";
import { GAME_MODE, GameLoopParams, GameResult, GameState, ScoreState, Status, WSocket } from "./model";
import { Users } from "./Users";
import { Tournament } from "./Tournament";




const users = new Users();
const tournament = new Tournament(users);

const Fastify = fastify();
Fastify.register(require('@fastify/websocket'));
Fastify.register(async function (fastify) {

  // GAME:
  // http: gameLoop data from game-service
  Fastify.post<{ Params: GameLoopParams, Body: GameState | ScoreState | GameResult }>('/game/:gameId', (request, reply) => {
    const { gameId } = request.params;
    const { players } = request.body;
    if (players.every(player => users.gameSocketIsAlive(player))) {
      players.forEach(player => {
        const sockets = users.getGameSocketById(player);
        if (sockets && sockets.length)
          sockets.forEach(socket => socket.send(JSON.stringify(request.body)));
      })

      if ("gameResult" in request.body)
      {
        const { score } = request.body;
        const data: ScoreRequestBody = {
          first_user_id: players[0],
          second_user_id: players[1],
          first_user_name: users.getUserNameById(players[0]) || '',
          second_user_name: users.getUserNameById(players[1]) || '',
          score: score,
          game_mode: 'pvp'
        };
        post_score_data(data);
      }
      reply.code(200).send({ message: "Message received" });
      return;
    }
    post_terminate_game(gameId);
    players.forEach((player, id) => {
      if (users.gameSocketIsAlive(player))
      {
        const sockets = users.getGameSocketById(player);
        if (sockets && sockets.length)
          sockets.forEach(socket => socket
            .send(JSON.stringify({ message: `${users.getUserNameById(players[(1-id)])} leave the room` })));
      }
    })
    // TODO terminate game
    reply.code(200).send({ message: "Message received" });
  })


  //ws:
  Fastify.get('/game', { websocket: true }, async (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {
    const token = req.headers['sec-websocket-protocol'] || '';
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
              const reply = {
                gameId: json.gameId,
                order: id,
                opponent: opponentNames[id],
                avatars: [avatars[0].avatar, avatars[1].avatar]
              };
              users.setPlayingStateToUser(gameSocketId);
              users.getGameSocketById(gameSocketId)?.forEach(socket => socket.send(JSON.stringify(reply)));
            });
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
      console.log("Disconnected", socket.id);
      socket.send('server socket is closed');
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
      if (!tournament.isUserInTournament(userData.user.id)) {
        socket.send(JSON.stringify({
          recipient: 'tournament',
          tournament_id: tournament.getTournamentId(),
          event: 'invite',
          time: Date.now()
        }));
      }
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
          tournament.onChatWSMessage(user_id, msg);
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
