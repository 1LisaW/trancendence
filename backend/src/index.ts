'use strict'

import fastify from "fastify";
import { WebSocket } from "@fastify/websocket";
import { nanoid } from "nanoid";
import { Auth_UserDTO, AuthUserErrorDTO, get_user__auth, get_user_profile_avatar, post_bat_move__game_service, post_matchmaking__game_service, post_terminate_game } from "./api";

interface WSocket extends WebSocket {
  id?: string,
  token?: string
};

enum Status { OFFLINE, ONLINE, MATCHMAKING, PLAYING }

class Users {
  private userPool: Set<string> = new Set(); // name
  private usersTokens: Map<string, string> = new Map(); // token: name

  private statuses: Map<string, Status> = new Map(); // name: status
  gameUserSockets: Map<string, WSocket> = new Map(); // socket.id: socket
  // gamePool: Set<string> = new Set(); //gameId
  // gameUsers: Map<string, string> = new Map(); // userid: gameId
  add(login: string, token: string) {
    if (this.userPool.has(login) && this.statuses[login] !== Status.OFFLINE)
      return;
    this.userPool.add(login);
    this.setStatus(login, Status.ONLINE);
    this.usersTokens.set(token, login);
    console.log("user added: ", this.usersTokens.get(token), " by token ", token);
  }
  addGameSocket(socket: WSocket) {
    if (socket.id)
      this.gameUserSockets.set(socket.id, socket);
    console.log("gameUserSockets ADD : ", [ ...users.gameUserSockets.keys()]);

  }
  removeGameSocket(socket: WSocket) {
    console.log("Backend GAME SOCKET removed")
    if (socket.id)
      this.gameUserSockets.delete(socket.id);
  }
  gameSocketIsAlive(socketId: string) {
    const socket = this.gameUserSockets.get(socketId);
    console.log('socketId:', socketId, " socket: ", !!socket);
    if (this.gameUserSockets.has(socketId))
      return (true);
    return (false);
  }
  getGameSocketById(socketId: string){
    return this.gameUserSockets.get(socketId);
  }
  private setStatus(login: string, status: Status) {
    this.statuses.set(login, status);
  }
  getUserStatus(userName: string) {
    return (this.statuses.get(userName));
  }
  getUserByToken(token: string) {
    return (this.usersTokens.get(token));
  }
  getUserByGameSocketId(gameSocketId: string) {
    const token = this.gameUserSockets.get(gameSocketId)?.token || '';
    console.log("getUserByGameSocketId gameSocketId:", gameSocketId, " token:",token, " login: ", this.usersTokens.get(token));
    return (this.usersTokens.get(token));
  }
  remove(login: string) {
    if (this.statuses.get(login) === Status.MATCHMAKING) { }
    this.setStatus(login, Status.OFFLINE);
  }
  matchmaking(userName: string, socket: WSocket, mode: 'pvp' | 'pvc') {
    this.gameUserSockets.set(userName, socket);
    this.setStatus(userName, Status.MATCHMAKING);
    console.log("this.matchmaking in process ", socket.id);

    return post_matchmaking__game_service(socket.id || '', mode);
  }
  // startPlay(gameId: string, player1: string, player2: string)
  // {
  //   this.setStatus(player1, Status.PLAYING);
  //   this.setStatus(player2, Status.PLAYING);
  //   this.gamePool.add(gameId);
  //   this.gameUsers[player1] = gameId;
  //   this.gameUsers[player2] = gameId;
  // }
  // stopPlay(gameId: string){
  //   this.gamePool.delete(gameId);

  // }
}


const users = new Users();

interface UserParams {
  userName: string;
}

const AUTH_HOSTNAME = "auth";
const AUTH_PORT = 8083;


const addUser = async (token: string) => {
  const data = await get_user__auth(token);
  if (data.status == 401)
    return (await data.json());
  const json: Auth_UserDTO = await data.json();
  console.log("Backend add user: json", json);

  const userName = json.user.name;
  users.add(userName, token);
  console.log("User ", userName, " has status ", users.getUserStatus(userName));
  return (json);
}

const removeUser = async (token: string) => {
  const data = await get_user__auth(token);
  let json: Auth_UserDTO | AuthUserErrorDTO = await data.json();
  console.log("Backend remove user: json", json);
  if ((json as AuthUserErrorDTO).error)
    return ;
  json = json as Auth_UserDTO;
  const userName = json.user.name;
  users.remove(userName);
  console.log("User ", userName, " has status ", users.getUserStatus(userName));
}


const Fastify = fastify();
Fastify.register(require('@fastify/websocket'));
Fastify.register(async function (fastify) {
  interface MatchmakingBody {
    mode: 'pvp' | 'pvc';
  }
  interface GameUserSessionBody {
    gameId: string,
    step: number
  }

  interface GameLoopParams {
    gameId: string
  }

  interface ExitGameParams {
    socketId: string
  }
  // GAME:
  // http: gameLoop data from game-service
  type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };

  type Tuple3<T> = Tuple<T, 3>;
  interface GameState {
    players: string[],
    pos: Tuple3<number>[],
    ball: Tuple3<number>
  }
  Fastify.post<{ Params: GameLoopParams, Body: GameState }>('/game/:gameId', (request, reply) => {
    const { gameId } = request.params;
    const { players } = request.body;
    if (players.every(player => users.gameSocketIsAlive(player)))
    {
      console.log("**players.every(player => users.gameSocketIsAlive(player))**");
      players.forEach(player => {
        const socket = users.getGameSocketById(player);
        if (socket)
          socket.send(JSON.stringify(request.body));
      })
      reply.code(200).send({ message: "Message received" });
      return ;
    }
    post_terminate_game(gameId);
    if (users.gameSocketIsAlive(players[0]))
    {
      const socket = users.getGameSocketById(players[0]);
      if (socket)
        socket.send(JSON.stringify({message: "Opponent leave the room"}));
    }
    if (users.gameSocketIsAlive(players[1]))
    {
      const socket = users.getGameSocketById(players[1]);
      if (socket)
        socket.send(JSON.stringify({message: "Opponent leave the room"}));
    }
    // TODO terminate game
    reply.code(200).send({ message: "Message received" });
  })

  // http: reply from game-service on gameSocket close event. If player had a game session notify his partner about game over.
  // Fastify.post<{Params:ExitGameParams}>('/exit/:socketId', (request, reply) => {
  //   const { socketId } = request.params;
  //   // TODO: send data in sockets if player was in GameSession
  //   reply.code(200).send({message: "Message received"});
  // })


  //ws:
  Fastify.get('/game', { websocket: true }, async (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {

    console.log("/game:", req.headers['sec-websocket-protocol']);
    const id = nanoid();
    socket.id = id;
    socket.token = req.headers['sec-websocket-protocol'];

    const userData = await addUser(socket.token || '');
    if (userData.error) {
      socket.close();
    }

    users.addGameSocket(socket);

    socket.on('message', async message => {

      const msg = JSON.parse(message.toString());
      if ('mode' in msg) {
        const mode = msg.mode as string;
        console.log("/game: mode", mode);
        if (mode === 'pvp' || mode === 'pvc') {

          const data = await users.matchmaking(users.getUserByToken(socket?.token || '') || '', socket, mode);
          const json = await data.json();
          console.log("Backend json: ", json);
          if ('gameId' in json) {
            const gameUsers: string[] = json.users;
            const opponentNames = [users.getUserByGameSocketId(gameUsers[1]), users.getUserByGameSocketId(gameUsers[0])];
            console.log("opponentNames: ",opponentNames);
//////

            const avatars = await Promise.all(opponentNames.map((name) =>  get_user_profile_avatar(name||'')));
            gameUsers.forEach((gameSocketId, id) => {
              const reply = {
                gameId: json.gameId,
                order: id,
                opponent: opponentNames[id],
                avatars: [avatars[0].avatar, avatars[1].avatar]
              };
              users.getGameSocketById(gameSocketId)?.send(JSON.stringify(reply));
            });
          }
        }
      }
      else if ('gameId' in msg) {
        const { gameId, step } = msg;
        post_bat_move__game_service(gameId, socket.id || '', step);
        console.log("BAT move /game: gameId", gameId);
      }
      console.log(msg);
    });
    socket.on('close', () => {
      console.log("gameUserSockets : ", [ ...users.gameUserSockets.keys()]);
      console.log(users.gameSocketIsAlive(socket?.id || ''));
      users.removeGameSocket(socket);
      console.log("gameUserSockets : ", [ ...users.gameUserSockets.keys()]);
      console.log(users.gameSocketIsAlive(socket?.id || ''));
      console.log("Disconnected", socket?.id);
      socket.send('server socket is closed');
    });
  })


  // CHAT:

  Fastify.get('/chat', { websocket: true }, async (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {
    console.log("/chat:", req.headers['sec-websocket-protocol']);
    const id = nanoid();
    socket.id = id;
    socket.token = req.headers['sec-websocket-protocol'];

    const userData = await addUser(socket.token || '');
    if (userData.error) {
      socket.close();
    }

    socket.on('message', message => {
      console.log("From backend:", message.toString());
    });

    socket.on('close', () => {
      removeUser(socket.token || '');
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
