// game-service

const GAME_SESSION_HOSTNAME = 'game-service';
const GAME_SESSION_PORT = 8081;

export const post_matchmaking__game_service = (socketId: string, mode: 'pvp'|'pvc'): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/matchmaking/${socketId}`, {
		method: "POST",
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({mode}),
	  })
	);
}

export const post_bat_move__game_service = (gameSessionId: string, socketId: string, step: number): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/game/${gameSessionId}`, {
		method: "POST",
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({userId: socketId, step}),
	  })
	);
}


//auth
export interface Auth_UserDTO {
	id: number,
	name: string,
	email: string
}
export interface AuthUserErrorDTO {
	error: string,
	details: unknown
}

const AUTH_HOSTNAME = "auth";
const AUTH_PORT = 8083;

export const get_user__auth = (token: string): Promise<Response> => {
	return (fetch(`http://${AUTH_HOSTNAME}:${AUTH_PORT}/user`, {
		method: "GET",
		headers: {
		  "Authorization": token,
		},
	  })
	);
}
