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

export const post_terminate_game = (gameId: string): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/terminate/${gameId}`, {
		method: "POST",
		// headers: {
		//   'Content-Type': 'application/json',
		// },
	  })
	);
}


//auth
export interface Auth_UserDTO {
	user: {
		id: number,
		name: string,
		email: string
	}
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


export interface GetUserAvatarResponse {
	avatar?: string;
	error?: string;
}

export const get_user_profile_avatar = async (name: string): Promise<{avatar:string}> => {
	const response = await fetch(`http://${AUTH_HOSTNAME}:${AUTH_PORT}/avatar/${name}`, {
		method: "GET",
	});
	const data: GetUserAvatarResponse = await response.json();
	if (data.error)
		return ({avatar:''});
	return ({avatar:data.avatar || ''});
}
