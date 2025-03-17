import fastify from "fastify";
import { ModeProp } from "./GameSession";
import { GameSessionFactory } from "./GameSessionFactory";

const Fastify = fastify();

class Matchmaking {

    private usersPool: string[] = [];

    private addUser(id: string): boolean {
        this.usersPool.push(id);
        return true;
    }
    private getOpponent() {
        return (this.usersPool.pop());
    }
    match(id: string): string | undefined {
        if (this.usersPool.includes(id))
            return undefined;
        const opponent = this.getOpponent();
        if (opponent)
            return opponent
        this.addUser(id);
        return undefined;
    }
    isInPool(id: string) {
        return (this.usersPool.includes(id));
    }
    removeUser(id: string) {
        this.usersPool = this.usersPool.filter((_id => _id !== id));
    }
}

const matchmaking = new Matchmaking();
const gameSessionFactory = new GameSessionFactory();

interface MatchmakingBody {
    playerId: string,
    mode: ModeProp
}
interface UserParams {
    socket_id: string
}

Fastify.post<{ Params: UserParams, Body: MatchmakingBody }>('/matchmaking/:socket_id', (request, reply) => {
    const { socket_id } = request.params;
    // const playerId = request.body.playerId;
    const mode = request.body.mode;
    if (mode === 'pvp') {
        const opponent = matchmaking.match(socket_id);
        if (opponent) {
            const game = gameSessionFactory.createSession(socket_id, opponent, mode);
            reply.send({ gameId: game.getId(), users: [opponent, socket_id] });
            gameSessionFactory.startGameLoop(game.getId());
            console.log("Game-service: matchmaking done");
            return
        }
        reply.send({ message: "User set in queue" });
    }
    // if player has active session reply "You have a game"
    console.log("Game-service: matchmaking not done");

    reply.send({
        opponent: null,
    });
})

Fastify.delete<{ Params: UserParams }>('/matchmaking/:socket_id', (request, reply) => {
    const { socket_id } = request.params;
    matchmaking.removeUser(socket_id);
    reply.send({ message: "User removed from queue" });
}
);



interface GamePostBody {
    userId: string,
    step: number
}
interface GamePostParams {
    gameId: string
}

Fastify.post<{ Params: GamePostParams }>('/terminate/:gameId', (request, reply) => {
    const { gameId } = request.params;
    gameSessionFactory.removeSession(gameId);
    reply.status(200).send({message: "game was terminated"})
})

Fastify.post<{ Params: GamePostParams, Body: GamePostBody }>('/game/:gameId', (request, reply) => {
    const { gameId } = request.params;
    const { userId, step } = request.body;
    gameSessionFactory.updateGameSessionUserData(gameId, userId, step);
    reply.status(200).send({message: "bat data updated"})
})

Fastify.listen({ port: 8081, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at: ${address}`);
});
