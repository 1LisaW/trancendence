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
	time: number;
}

export interface ChatTournamentStartMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'start';
	time: number;
}

export interface ChatTournamentFinishMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'finish';
	time: number;
	canceled: boolean;
	rating: number;
}

export interface ChatTournamentMatchmakingMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'matchmaking';
	time: number;
	opponent: string;
}

export interface ChatTournamentMatchMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'match';
	time: number;
	opponent: string;
	option: MatchOptions;
}

export type ChatTournamentMessage = ChatTournamentInviteMessage | ChatTournamentStartMessage
	| ChatTournamentMatchmakingMessage | ChatTournamentMatchMessage | ChatTournamentFinishMessage;


export interface ChatTournamentInviteReply {
	recipient: 'tournament';
	tournament_id: number;
	event: 'invite';
	reply: boolean;
}

export interface ChatTournamentMatchmakingReply {
	recipient: 'tournament';
	tournament_id: number;
	event: 'matchmaking';
	opponent: string;
	reply: boolean;
}

export type ChatTournamentReply = ChatTournamentInviteReply | ChatTournamentMatchmakingReply;
