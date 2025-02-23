'use strict'

import fastify from "fastify";
import { WebSocket } from "@fastify/websocket";
import http from "http";
import { nanoid } from "nanoid";
import { hostname } from "os";

const GAME_SESSION_HOSTNAME = 'http://game-service:8081';

const getOptions = (hostname: string, path: string, method: string, data: string)=>{
  const options = {
    hostname: 'api.example.com',
    path: '/endpoint',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };
  return (options);
}

const makeHTTPRequest = (host: string, path: string, method: string, data:string) => {
  const options = {
    hostname: 'game-service',
    port: 8081,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };
  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
  // return ()
}

interface WSocket extends WebSocket {
  id?: string
};

enum Status { OFFLINE, ONLINE, MATCHMAKING, PLAYING}

class Users {
  private userPool: Set<string> = new Set();
  private statuses: Map<string, Status> = new Map();
  gameUserSockets: Map<string, WSocket> = new Map();
  // gamePool: Set<string> = new Set(); //gameId
  // gameUsers: Map<string, string> = new Map(); // userid: gameId
  add(login:string){
    if (this.userPool[login] && this.statuses[login] !== Status.OFFLINE)
      return ;
    this.userPool.add(login);
    this.setStatus(login, Status.ONLINE);
  }
  private setStatus(login:string, status: Status){
    this.statuses[login] = status;
  }
  getUserStatus(userName:string)
  {
    return (this.statuses[userName]);
  }
  remove(login: string){
    this.setStatus(login, Status.OFFLINE);
  }
  matchmaking(userName:string, socket: WSocket, mode: string) {
    this.gameUserSockets[userName] = socket;
    this.setStatus(userName, Status.MATCHMAKING);
    console.log("this.matchmaking in process ", socket.id);
    makeHTTPRequest(GAME_SESSION_HOSTNAME, `/matchmaking/${socket.id}`, 'POST', JSON.stringify({
      mode
    }))
    // fetch(`http:/localhost:3001/matchmaking/:${socket.id}`);
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

const Fastify = fastify();
Fastify.register(require('@fastify/websocket'));
Fastify.register(async function (fastify) {

  Fastify.get('/', (request, reply) => {
    console.log("request was received in backend" );
    // console.log("User ", userName, " has status ", users.getUserStatus(userName));
    reply.code(200).send({message: "you're connected to backend service"});
  })

  Fastify.post<{Params:UserParams}>('/login/:userName', (request, reply) => {
    const { userName } = request.params;
    users.add(userName);
    console.log("User ", userName, " has status ", users.getUserStatus(userName));
    reply.code(200).send({message: "user login signal received"});
  })
  Fastify.post<{Params:UserParams}>('/logout/:userName', (request, reply) => {
    const { userName } = request.params;
    users.remove(userName);
    console.log("User ", userName, " has status ", users.getUserStatus(userName));
    reply.code(200).send({message: "user logout signal received"});

  })
  interface MatchmakingBody {
    mode: 'pvp' | 'pvc';
  }
  interface GameUserSessionBody {
    gameId: string,
    step: number
  }
  // interface QueryParams: {
  //   mode: 'pvp'
  // }
  Fastify.get<{ Params: UserParams, Querystring: MatchmakingBody | GameUserSessionBody }>('/game/:userName', { websocket: true }, (socket: WSocket /* WebSocket */, req /* FastifyRequest */) => {
    const { userName } = req.params;
    console.log("/game/:userName id:", socket.id);
    const id = nanoid();
    socket.id = id;

    socket.on('message', message => {
      if ('mode' in req.query)
      {
        const mode:string = req.query.mode ;
        users.matchmaking(userName, socket, mode);
      }
      else
      {

      }
      console.log(message.toString());
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
