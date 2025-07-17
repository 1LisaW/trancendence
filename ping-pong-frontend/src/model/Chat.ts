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

export interface ChatTournamentMatchResultMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'match_result';
	time: number;
	opponent: string;
	option: MatchOptions;
}

export type ChatTournamentMessage = ChatTournamentInviteMessage | ChatTournamentStartMessage
	| ChatTournamentMatchmakingMessage | ChatTournamentMatchResultMessage | ChatTournamentFinishMessage | ChatTournamentMatchInitMessage;


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

export interface ChatTournamentMatchInitMessage {
	recipient: 'tournament';
	tournament_id: number;
	event: 'match';
	time: number;
	opponent_name: string;
	opponentId: number;
	option: MatchOptions;
	isInitiator: boolean;
}

export interface ChatChatHelp {
	recipient: 'chat';
	event: 'help';
}

export interface ChatChatAddFriend {
	recipient: 'chat';
	event: 'friend';
	users: string[];
}

export interface ChatChatRemoveFriend {
	recipient: 'chat';
	event: 'unfriend';
	users: string[];
}

export interface ChatChatBlock {
	recipient: 'chat';
	event: 'block';
	users: string[];
}

export interface ChatChatMessage {
	recipient: 'chat';
	event: 'message';
	message: string;
}

export type ChatTournamentReply = ChatTournamentInviteReply | ChatTournamentMatchmakingReply;
export type ChatChatReply = ChatChatHelp | ChatChatAddFriend | ChatChatBlock | ChatChatRemoveFriend | ChatChatMessage
