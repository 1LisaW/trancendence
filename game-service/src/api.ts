const WS_SERVICE_HOSTNAME = "http://backend:8082";

type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };

type Tuple3<T> = Tuple<T, 3>;

export interface GameState {
	players: number[],
	pos: Tuple3<number>[],
	ball: Tuple3<number>
}

export interface ScoreState {
	players: number[],
	score: number[],
}

export interface GameResult {
	players: number[],
	gameResult: number[],
	score: number[],
	mode: 'pvp' | 'pvc' | 'tournament',
}

export interface GameTerminated {
	terminated: boolean,
	message: string
}


export const post_game_loop_data = async(gameId:string, state: GameState | ScoreState | GameResult | GameTerminated)=>{
	return (
		fetch(`${WS_SERVICE_HOSTNAME}/game/${gameId}`, {
			method: "POST",
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify(state),
		  })
	)
}



