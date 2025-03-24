// game-service

const GAME_SESSION_HOSTNAME = 'game-service';
const GAME_SESSION_PORT = 8081;

export const post_matchmaking__game_service = (socketId: number, mode: 'pvp'|'pvc'): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/matchmaking/${socketId}`, {
		method: "POST",
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({mode}),
	  })
	);
}

export const post_bat_move__game_service = (gameSessionId: string, socketId: number, step: number): Promise<Response> => {
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

export const delete_user_from_matchmaking = (socketId: number): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/matchmaking/${socketId}`, {
		method: "DELETE",
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

export interface AUTH_ServerErrorDTO {
	error: string,
	details: unknown
}

export interface AUTH_AuthErrorDTO {
	error: string,
}
export interface AUTH_GetUserDTO {
	user: {
		id: number,
		name: string,
		email: string
	}
}

export const get_user__auth = async(token: string) => {
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

const SCORE_SERVICE_HOSTNAME = "http://score:8084";

interface ScoreRequestBody {
	first_user_id: string,
	second_user_id: string,
	first_user_name: string,
	second_user_name: string,
	score: number[],
	game_mode: string
}

export const post_score_data = async (data: ScoreRequestBody) => {
	return (
		fetch(`${SCORE_SERVICE_HOSTNAME}/score`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
	)
}
