'use strict'

import fastify from "fastify";
import { WebSocket } from "@fastify/websocket";
import { nanoid } from "nanoid";
import { Auth_UserDTO, get_user__auth, post_bat_move__game_service, post_matchmaking__game_service } from "./api";

interface WSocket extends WebSocket {
  id?: string,
  token?: string
};

enum Status { OFFLINE, ONLINE, MATCHMAKING, PLAYING}

class Users {
  private userPool: Set<string> = new Set();
  private usersTokens:Map<string, string> = new Map();

  private statuses: Map<string, Status> = new Map();
  gameUserSockets: Map<string, WSocket> = new Map();
  // gamePool: Set<string> = new Set(); //gameId
  // gameUsers: Map<string, string> = new Map(); // userid: gameId
  add(login:string, token:string){
    if (this.userPool[login] && this.statuses[login] !== Status.OFFLINE)
      return ;
    this.userPool.add(login);
    this.setStatus(login, Status.ONLINE);
    this.usersTokens[token] = login;
  }
  addGameSocket(socket:WSocket)
  {
    if (socket.id)
      this.gameUserSockets[socket.id] = socket;
  }
  private setStatus(login:string, status: Status){
    this.statuses[login] = status;
  }
  getUserStatus(userName:string)
  {
    return (this.statuses[userName]);
  }
  getUserByToken(token:string)
  {
    return (this.usersTokens[token]);
  }
  getUserByGameSocketId(gameSocketId:string){
    const token = this.gameUserSockets[gameSocketId].token;
    return (this.usersTokens[token]);
  }
  remove(login: string){
    this.setStatus(login, Status.OFFLINE);
  }
  matchmaking(userName:string, socket: WSocket, mode: 'pvp'|'pvc') {
    this.gameUserSockets[userName] = socket;
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


const addUser = async(token:string) => {
  const data = await get_user__auth(token);
  if (data.status == 401)
    return (await data.json());
  const json:Auth_UserDTO = await data.json();
  console.log("Backend add user: json", json);

  const userName = json.name;
  users.add(userName, token);
  console.log("User ", userName, " has status ", users.getUserStatus(userName));
  return (json);
}

const removeUser = async(token:string) => {
  const data = await get_user__auth(token);
  const json:Auth_UserDTO = await data.json();
  console.log("Backend remove user: json", json);
  const userName = json.name;
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

  // GAME:
  Fastify.get('/game', { websocket: true }, async (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {

    console.log("/game:", req.headers['sec-websocket-protocol']);
    const id = nanoid();
    socket.id = id;
    socket.token = req.headers['sec-websocket-protocol'];

    const userData = await addUser(socket.token || '');
    if (userData.error)
    {
      socket.close();
    }

    users.addGameSocket(socket);

    socket.on('message', async message => {

      const msg = JSON.parse(message.toString());
      if ('mode' in msg)
      {
        const mode = msg.mode as string ;
        console.log("/game: mode", mode);
        if (mode === 'pvp' || mode === 'pvc')
        {
          const data = await users.matchmaking(users.getUserByToken(socket?.token||''), socket, mode);
          const json = await data.json();
          console.log("Backend json: ", json);
          if ('gameId' in json)
          {
            const gameUsers:string[] = json.users;
            const opponentNames = [users.getUserByGameSocketId(gameUsers[1]), users.getUserByGameSocketId(gameUsers[0])]
            gameUsers.forEach((gameSocketId, id) => {
              const reply = {
                gameId: json.gameId,
                order: id,
                opponent: opponentNames[id]
              };
            users.gameUserSockets[gameSocketId].send(JSON.stringify(reply));
            });
            // console.log("Backend json gameId: ", json.gameId);
            // const order = json.users[0] === socket.id ?0:1;
            // const opponent
            // const reply = {
            //   gameId: json.gameId,
            //   order

            // }
            // socket.send(JSON.stringify({"gameId": json.gameId, users: json.users}));
          }
        }
      }
      else if ('gameId' in msg)
      {
        const {gameId, step} = msg;
        post_bat_move__game_service(gameId, socket.id || '', step);
        console.log("/game: gameId", gameId);
      }
      console.log(msg);
      // console.log(JSON.parse(message));
      // message.toString() === 'hi from client'
      socket.send('hi from server');
      // fastify.close();
    });
    socket.on('close', ()  => {
      // console.log(socket);
      // console.log(JSON.parse(message));
      console.log("Disconnected", socket?.id);
      // message.toString() === 'hi from client'
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
    if (userData.error)
    {
      socket.close();
    }

    socket.on('message', message => {
      console.log("From backend:",message.toString());
    });

    socket.on('close', ()  => {
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
