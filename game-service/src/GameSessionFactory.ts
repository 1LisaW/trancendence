import { GameState, post_game_loop_data, ScoreState, GameResult } from "./api";
import { GameSession, ModeProp } from "./GameSession";

const WS_SERVICE_HOSTNAME = "http://backend:8082";
export class GameSessionFactory {
	private sessionPool: GameSession[] = [];
	constructor(){

	}
	createSession(playerId:number, opponentId: number, mode: ModeProp ){
		const newGameSession = new GameSession(mode, playerId, opponentId, this.sendDataToUser);
		this.sessionPool.push(newGameSession);
		return (newGameSession);
	}

	removeSession(session_id: string, userId: number) {
		const session = this.sessionPool.find(session => session.getId() === session_id);
		session?.terminate(userId);
		this.sessionPool = this.sessionPool.filter((session) => session.getId()!= session_id);
	}

	private getGameSession(gameId: string){
		return (this.sessionPool.find((game) => game.getId() === gameId))
	}

	updateGameSessionUserData(gameId: string, userId:number, step: number) {
		const gameSession = this.getGameSession(gameId);
		if (gameSession)
		{
			gameSession.setBatMove(userId, step);
		}
	}

	sendDataToUser = (gameId:string, state: GameState | ScoreState | GameResult) => {
		post_game_loop_data(gameId, state);
		if (this.getGameSession(gameId)?.isFinished())
			this.sessionPool = this.sessionPool.filter((session) => session.getId()!= gameId);
	}

	startGameLoop(gameId:string) {
		console.log("** GameSessionFactory call startGameLoop");
		const gameSession = this.getGameSession(gameId);
		if (gameSession)
		{
			console.log("- ** GameSessionFactory call startGameLoop gameSession.gameLoop()");
			gameSession.gameLoop();
		}
	}
}
