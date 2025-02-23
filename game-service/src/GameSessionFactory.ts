import { GameSession, ModeProp } from "./GameSession";

export class GameSessionFactory {
	private sessionPool: GameSession[] = [];
	constructor(){

	}
	createSession(playerId:string, opponentId: string, mode: ModeProp ){
		const newGameSession = new GameSession(mode, playerId, opponentId);
		this.sessionPool.push(newGameSession);
		return (newGameSession);
	}
	removeSession(session_id: string) {
		this.sessionPool = this.sessionPool.filter((session) => session.getId()!= session_id);
	}

	private getGameSession(gameId: string){
		return (this.sessionPool.find((game) => game.getId() === gameId))
	}
	updateGameSessionUserData(gameId: string, userId:string, step: number) {
		const gameSession = this.getGameSession(gameId);
		if (gameSession)
		{
			gameSession.setBatMove(userId, step);
		}
	}
}
