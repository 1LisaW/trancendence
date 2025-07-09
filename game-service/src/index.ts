import fastify from "fastify";
import { ModeProp } from "./GameSession";
import { GameSessionFactory } from "./GameSessionFactory";
import { GAME_MODE } from "./model";

const Fastify = fastify();

class Matchmaking {

    private usersPool: number[] = [];

    private addUser(id: number): boolean {
        this.usersPool.push(id);
        return true;
    }
    private getOpponent() {
        return (this.usersPool.pop());
    }
    match(id: number): number | undefined {
        if (this.usersPool.includes(id))
            return undefined;
        const opponent = this.getOpponent();
        if (opponent)
            return opponent
        this.addUser(id);
        return undefined;
    }
    isInPool(id: number) {
        return (this.usersPool.includes(id));
    }
    removeUser(id: number) {
        this.usersPool = this.usersPool.filter((_id => _id !== id));
    }
}

const matchmaking = new Matchmaking();
const gameSessionFactory = new GameSessionFactory();

interface MatchmakingBody {
    playerId: number,
    opponentId?: number,
    mode: GAME_MODE
}
interface UserParams {
    socket_id: number
}

Fastify.post<{ Params: UserParams, Body: MatchmakingBody }>('/matchmaking/:socket_id', (request, reply) => {
    let { socket_id } = request.params;
    socket_id = Number(socket_id);
    // const playerId = request.body.playerId;
    const mode = request.body.mode;
    switch (mode) {
        case GAME_MODE.PVP:
            const opponent = matchmaking.match(socket_id);
            if (opponent) {
                const game = gameSessionFactory.createSession(socket_id, opponent, mode);
                reply.send({ gameId: game.getId(), users: [opponent, socket_id] });
                gameSessionFactory.startGameLoop(game.getId());
                console.log("Game-service: matchmaking done");
                return ;
            }
            reply.send({ message: "User set in queue" });
            break;
        case GAME_MODE.TOURNAMENT:
            if ('opponentId' in request.body) {
                const opponentId = Number(request.body.opponentId);
                const game = gameSessionFactory.createSession(socket_id, opponentId, mode);
                console.log("Game-service (TOURNAMENT): matchmaking done ", { gameId: game.getId(), users: [opponentId, socket_id] });
                const gameId = game.getId();
                reply.send({ gameId: gameId, users: [opponentId, socket_id] });
                gameSessionFactory.startGameLoop(gameId);
                console.log("Game-service (TOURNAMENT): matchmaking done");
                return ;
            }
            break;

    }


    // if player has active session reply "You have a game"
    console.log("Game-service: matchmaking not done");

    reply.send({
        opponent: null,
    });
})

Fastify.delete<{ Params: UserParams }>('/matchmaking/:socket_id', (request, reply) => {
    let { socket_id } = request.params;
    socket_id = Number(socket_id);
    matchmaking.removeUser(socket_id);
    reply.send({ message: "User removed from queue" });
}
);



interface GamePostBody {
    userId: number,
    step: number
}
interface GamePostParams {
    gameId: string
}

Fastify.post<{ Params: GamePostParams, Body: {userId: number} }>('/terminate/:gameId', (request, reply) => {
    const { gameId } = request.params;
    const userId = request.body.userId;
    gameSessionFactory.removeSession(gameId, userId);
    reply.status(200).send({ message: "game was terminated" })
})

Fastify.post<{ Params: GamePostParams, Body: GamePostBody }>('/game/:gameId', (request, reply) => {
    const { gameId } = request.params;
    const { userId, step } = request.body;
    gameSessionFactory.updateGameSessionUserData(gameId, userId, step);
    reply.status(200).send({ message: "bat data updated" })
})

Fastify.listen({ port: 8081, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at: ${address}`);
});
