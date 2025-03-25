import { error } from "console"

export interface SCORE_PostNewScoreRequestBody {
	first_user_id: string,
	second_user_id: string,
	first_user_name: string,
	second_user_name: string,
	score: number[],
	game_mode: string
}

export interface SCORE_PostNewScoreReply {
	message: string,
	details?: unknown
}

export interface SCORE_GetUserScoreRequestParams {
	user_id: number
}

export interface SCORE_ScoreDTO {
	data: Date,
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	first_user_score: number,
	second_user_score: number,
	game_mode: string
}

export interface SCORE_ServerErrorReply {
	error: string,
	details?: unknown
}
