import { WebSocket } from "@fastify/websocket";
import { post_matchmaking__game_service } from "./api";


export interface GameLoopParams {
	gameId: string
}

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
	gameResult: string[],
	score: number[],
	mode: 'pvp' | 'pvc' | 'tournament',
}
export interface WSocket extends WebSocket {
	id?: number,
	token?: string
};

export enum Status { OFFLINE, ONLINE, MATCHMAKING, PLAYING }

export interface SCORE_TournamentDTO {
	id: number,
	date: number,
	is_finished: boolean
}

export interface SCORE_ErrorDTO {
	error: string
}

export interface SCORE_TournamentDTO {
	tournament: {
		id: number,
		date: number,
		is_finished: boolean
	}
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
	date: number,
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	first_user_score: number,
	second_user_score: number,
}

export type SCORE_TournamentDataDTO = SCORE_TournamentScoreDTO & SCORE_TournamentUserDTO & SCORE_TournamentScoreDTO;

export enum MatchOptions {
	START,
	FORFEIT,
	TECHNICAL_WIN,
	WIN,
	LOSE,
	DRAW
}

export interface ChatTournamentInviteMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'invite';
	reply: boolean;
}

export interface ChatTournamentMatchmakingMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'matchmaking';
	opponent_name: string;
	reply: boolean;
}

export type ChatTournamentMessage = ChatTournamentInviteMessage | ChatTournamentMatchmakingMessage;

export enum GAME_MODE {
	PVP = 'pvp',
	PVC = 'pvc',
	TOURNAMENT = 'tournament',
}
