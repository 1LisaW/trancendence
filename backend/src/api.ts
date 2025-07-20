// game-service

import { MatchOptions, SCORE_ErrorDTO, SCORE_TournamentDataDTO, SCORE_TournamentDTO, SCORE_TournamentScoreDTO } from "./model";

// blockchain-service
const BLOCKCHAIN_SERVICE_HOSTNAME = 'blockchain-service';
const BLOCKCHAIN_SERVICE_PORT = 8088;

// post score to blockchain-service
export const post_score_to_blockchain = async (score: {
	tournamentId: string;
	first_user_id: number;
	second_user_id: number;
	first_user_name: string;
	second_user_name: string;
	score: string;
	game_mode: string;
}): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
	try {
		const response = await fetch(`http://${BLOCKCHAIN_SERVICE_HOSTNAME}:${BLOCKCHAIN_SERVICE_PORT}/store-score`, {
			method: "POST",
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify(score),
		});
		const data = await response.json();
		if (data.error) {
			return { success: false, error: data.error };
		}
		return { success: true, transactionHash: data.transactionHash };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
};

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

	// fetch all tournament game scores and post to blockchain
	if ('tournament_id' in data) {
		const tournamentData = await get_tournaments_data(tournament_id);
		console.log('Tournament data for blockchain:', JSON.stringify(tournamentData, null, 2));
		if ('tournaments' in tournamentData) {
			for (const game of tournamentData.tournaments) {
				const blockchainScore = {
					tournamentId: `tournament_${tournament_id}_game_${game.id}`,
					first_user_id: game.first_user_id,
					second_user_id: game.second_user_id,
					first_user_name: game.first_user_name,
					second_user_name: game.second_user_name,
					score: `${game.first_user_score}-${game.second_user_score}`,
					game_mode: 'tournament',
				};
				const blockchainResult = await post_score_to_blockchain(blockchainScore);
				if (!blockchainResult.success) {
					console.error(`Failed to store tournament ${tournament_id} game ${game.id} score on blockchain: ${blockchainResult.error}`);
				} else {
					console.log(`Tournament ${tournament_id} game ${game.id} score stored on blockchain with tx hash: ${blockchainResult.transactionHash}`);
				}
			}
		} else {
			console.error(`Failed to fetch tournament ${tournament_id} data for blockchain: ${tournamentData.error}`);
		}
	}

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

// chat
const CHAT_HOSTNAME = 'chat';
const CHAT_PORT = 8087;

export const post_user_friends = async(token: string, friends: string[]) => {
	return (fetch(`http://${AUTH_HOSTNAME}:${AUTH_PORT}/friends`, {
		method: "POST",
		headers: {
		  "Authorization": token,
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({friends}),
	  })
	);
}

export const post_user_blocks = async(token: string, blocks: string[]) => {
	return (fetch(`http://${AUTH_HOSTNAME}:${AUTH_PORT}/blocks`, {
		method: "POST",
		headers: {
		  "Authorization": token,
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({blocks}),
	  })
	);
}

export const get_user_blocks = async(user_id: number) => {
	return (fetch(`http://${AUTH_HOSTNAME}:${AUTH_PORT}/blocks/${user_id}`, {
		method: "GET",
		// headers: {
		//   "Authorization": token,
		// //   'Content-Type': 'application/json',
		// },
		// body: JSON.stringify({blocks}),
	  })
	);
}


export const post_user_unfriends = async(token: string, friends: string[]) => {
	return (fetch(`http://${AUTH_HOSTNAME}:${AUTH_PORT}/unfriends`, {
		method: "POST",
		headers: {
		  "Authorization": token,
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({friends}),
	  })
	);
}

export const get_help = async() => {
	return (fetch(`http://${CHAT_HOSTNAME}:${CHAT_PORT}/chat/help`, {
		method: "GET",
	  })
	);
}
