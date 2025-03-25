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
	score: number[]
}
export interface WSocket extends WebSocket {
	id?: number,
	token?: string
};

export enum Status { OFFLINE, ONLINE, MATCHMAKING, PLAYING }

