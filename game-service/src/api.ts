const WS_SERVICE_HOSTNAME = "http://backend:8082";

type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };

type Tuple3<T> = Tuple<T, 3>;

export interface GameState {
	players: string[],
	pos: Tuple3<number>[],
	ball: Tuple3<number>
}

export const post_game_loop_data = async(gameId:string, state: GameState)=>{
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

// export const post_exit_user = async (socketId:string) => {
// 	return (
// 		fetch(`${WS_SERVICE_HOSTNAME}/exit/${socketId}`, {
// 			method: "POST",
// 			headers: {
// 			  'Content-Type': 'application/json',
// 			},
// 			body: JSON.stringify({message: "Your opponent leave the game"}),
// 		  })
// 	)
// }
