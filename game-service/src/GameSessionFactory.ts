import { GameState, post_game_loop_data, ScoreState, GameResult } from "./api";
import { GameSession, ModeProp } from "./GameSession";

const WS_SERVICE_HOSTNAME = "http://backend:8082";
export class GameSessionFactory {
	private sessionPool: GameSession[] = [];
	constructor(){

	}
	
	// COMMENTED OUT ORIGINAL // VERSION WITH AI BELOW 
	//createSession(playerId:number, opponentId: number, mode: ModeProp ){
	//	const newGameSession = new GameSession(mode, playerId, opponentId, this.sendDataToUser);
	//	this.sessionPool.push(newGameSession);
	//	return (newGameSession);
	//}

	//*** [ADDED] Implementing AI logic */
	createSession(playerId: number, opponentId: number | null, mode: ModeProp) { // [CHANGED] Allow null opponentId
		const aiOpponentId = mode === 'pvc' ? 0 : opponentId!; // Using 0 for AI
		const newGameSession = new GameSession(mode, playerId, aiOpponentId, this.sendDataToUser);
		this.sessionPool.push(newGameSession);
		return newGameSession;
	}
	// ** END OF ADDED BIT LOGIC

	removeSession(session_id: string) {
		const session = this.sessionPool.find(session => session.getId() === session_id);
		session?.terminate();
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
		post_game_loop_data(gameId, state)
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
