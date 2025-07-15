// game-service

import { MatchOptions, SCORE_ErrorDTO, SCORE_TournamentDataDTO, SCORE_TournamentDTO, SCORE_TournamentScoreDTO } from "./model";

const GAME_SESSION_HOSTNAME = 'game-service';
const GAME_SESSION_PORT = 8081;

export const post_matchmaking__game_service = (socketId: number, mode: 'pvp'|'pvc'|'tournament'): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/matchmaking/${socketId}`, {
		method: "POST",
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({mode}),
	  })
	);
}

export const post_matchmaking_with_specific_user__game_service = (socketId: number, mode: 'pvp' | 'pvc' |'tournament', opponentId: number): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/matchmaking/${socketId}`, {
		method: "POST",
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({mode, opponentId}),
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

export const post_terminate_game = (gameId: string, disconnectedPlayer: number): Promise<Response> => {
	return (fetch(`http://${GAME_SESSION_HOSTNAME}:${GAME_SESSION_PORT}/terminate/${gameId}`, {
		method: "POST",
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({userId: disconnectedPlayer}),
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

export interface ScoreRequestBody {
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	game_results: number[],
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

export const get_active_tournaments = async () => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/init`, {
		method: "GET",
	});
	const data:SCORE_TournamentDTO | SCORE_ErrorDTO = await response.json();
	return (data)
}

export const post_new_tournament = async (users: number[]) => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/new`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({users}),
	});
	const data: {tournament_id: number, date: number} | {error: string} = await response.json();
	return (data);
}

export const post_new_tournament_user = async (tournament_id: number, user_id: number) => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/users/${tournament_id}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({user_id}),
	});
	const data: {tournament_id: number, user_id: number} | {error: string} = await response.json();
	return (data);
}


export const post_new_tournament_score = async (tournament_id: number, score: ScoreRequestBody) => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/score/${tournament_id}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(score),
	});
	const data: {tournament_id: number, date: number} | {error: string} = await response.json();
	return (data);
}

export const post_tournament_finish = async (tournament_id: number) => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/finish`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({tournament_id}),
	});
	const data: {tournament_id: number, date: number} | {error: string} = await response.json();
	return (data);
}

export const get_tournaments_data = async (tournament_id: number) => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/tournament/${tournament_id}`, {
		method: "GET",
	});
	const data:{ tournaments: SCORE_TournamentDataDTO[]} | SCORE_ErrorDTO = await response.json();
	return (data)
}

export const delete_tournament = async (tournament_id: number) => {
	const response = await fetch(`${SCORE_SERVICE_HOSTNAME}/tournament/tournament/${tournament_id}`, {
		method: "DELETE",
	});
	// const data: {message: string} | SCORE_ErrorDTO = await response.json();
	// return (data);
}

// ai-service

const AI_SESSION_HOSTNAME = 'ai-service';
const AI_SESSION_PORT = 8086;

export const post_new_ai_session = (user_id: number): Promise<Response> => {
	return (fetch(`http://${AI_SESSION_HOSTNAME}:${AI_SESSION_PORT}/session/new/${user_id}`, {
		method: "POST",
		// headers: {
		//   'Content-Type': 'application/json',
		// },
	  })
	);
}
