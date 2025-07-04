
export enum SCORE_GAME_RESULT {
	WIN = "win",
	LOSE = "lose",
	DRAW = "draw",
	TECHNICAL_WIN = "technical_win",
	TECHNICAL_LOSE = "technical_lose",
}

export enum SCORE_GAME_MODE {
	PVP = "pvp",
	AI = "pvc",
	TOURNAMENT = "tournament",
}

export interface SCORE_PostNewScoreRequestBody {
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	score: number[],
	game_results: SCORE_GAME_RESULT[],
	game_mode: SCORE_GAME_MODE,
}

export interface SCORE_PostNewScoreReply {
	message: string,
	details?: unknown
}

export interface SCORE_GetUserScoreRequestParams {
	user_id: number
}

export interface SCORE_ScoreDTO {
	date: number,
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	first_user_score: number,
	second_user_score: number,
	first_user_result: string,
	second_user_result: string,
	game_mode: string
}

export interface SCORE_ServerErrorReply {
	error: string,
	details?: unknown
}

export interface SCORE_TournamentDTO {
	id: number,
	date: number,
	is_finished: boolean
}

export interface SCORE_TournamentUserDTO {
	id: number,
	tournament_id: number,
	user_id: number,
	rating: number
}
export interface SCORE_TournamentScoreDTO {
	id: number,
	tournament_id: number,
	date: Date,
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	first_user_score: number,
	second_user_score: number,
}

export type SCORE_TournamentDataDTO = SCORE_TournamentScoreDTO & SCORE_TournamentUserDTO & SCORE_TournamentScoreDTO;
