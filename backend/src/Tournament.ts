import { Status } from "./model";
import { Users } from "./Users";

interface Match {
	user: number,
	played: number[],
	decline: number
}
interface TournamentState {
	matches: Match[]
	scores: Record<number, number>[],
	rating: Record<number, number>,
}
const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60;
export class Tournament {
	private isStarted: boolean;
	private isFinished: boolean;
	private usersPool: number[] = [];
	private startDate: number;
	private users: Users;
	private tournament: TournamentState | null;

	constructor(users: Users, user: number) {
		this.isStarted = false;
		this.isFinished = false;
		this.usersPool = [];
		this.usersPool.push(user);
		this.startDate = Date.now();
		this.tournament = null;
		this.users = users;
	}


	init() {
		const lobbyCheck = () => {
			if (this.isStarted)
			{
				clearInterval(setLobbyCheck);
			}
			else {
				if (this.usersPool.length < 3)
					return;
				this.tournament = { scores: [], rating: {}, matches: [] };
				this.usersPool.forEach(userId => {
					if (this.tournament)
						this.tournament.matches.push({ user: userId, played: [], decline: 0 });
				});
				this.isStarted = true;
				this.startDate = Date.now();
			}
		}
		const setLobbyCheck = setInterval(lobbyCheck, TOURNAMENT_LOBBY_CHECK_PERIOD)
	}
	addToPool(user_id: number) {
		this.usersPool.push(user_id);
	}
	matchmaking() {
		const matchmakingCheck = () => {
			if (this.isFinished) {
				clearInterval(setMatchmakingCheck);
			}
			else if (this.tournament) {
				const usersAmount = this.tournament.matches.length;
				if (usersAmount === 1)
					return;
				if (usersAmount === 2 && this.tournament.matches.every(({ played }) => Object.values(played).length == 1))
					return;
				if (this.tournament.matches.every(({ played }) => Object.values(played).length == 2))
					return;
				const activePlayers = this.usersPool.filter(user_id => this.users.getUserStatus(user_id) === Status.ONLINE);
				if (activePlayers.length < 2)
					return;
				const availablePlayers = this.tournament.matches.filter(match => match.played.length < 2
					&& activePlayers.find((id) => id === match.user));
				if (availablePlayers.length < 2)
					return;
				availablePlayers.forEach((match, id) => {
					if (match.played.length >= 2)
						return;
					let nextId = ++id;
					if (nextId === availablePlayers.length)
						return;
					while (nextId < availablePlayers.length) {
						if (match.played.find(id => id === availablePlayers[nextId].user))
							nextId++;
						else {
							match.played.push(availablePlayers[nextId].user);
							availablePlayers[nextId].played.push(match.user);
							//send message to start tournament and if not accepted remove players
							return;
						}
					}
				})

			}
		}
		const setMatchmakingCheck = setInterval(matchmakingCheck, TOURNAMENT_LOBBY_CHECK_PERIOD);

	}
	terminate_matchmaking(userId: number, opponentId: number) {
		if (this.tournament === null)
			return;
		// const level = this.tournament.reverse().find(level => level.matches.find(({ user }) => user === userId));
		const userMatch = this.tournament.matches.find(match => match.user === userId);
		if (userMatch && userMatch.played.find(user => user == opponentId)) {
		}
		// const opponentId = level?.matches.find(match =>match.user === userId)?.played.pop();
	}

}
