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
