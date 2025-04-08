import { get_active_tournaments, get_tournaments_data, post_new_tournament } from "./api";
import { Status } from "./model";
import { Users } from "./Users";

interface Match {
	user: number,
	played: Set<number>,
}
interface TournamentState {
	id: number;
	rating: Record<number, number>,
	matches: Match[]
	// scores: Record<number, number>[],
}
const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60;
export class Tournament {
	private isStarted: boolean;
	private isFinished: boolean;
	private usersPool: number[] = [];
	private startDate: number;
	private users: Users;
	private tournament: TournamentState | null = null;

	constructor(users: Users) {
		this.isStarted = false;
		this.isFinished = false;
		this.usersPool = [];
		this.startDate = Date.now();
		this.users = users;
	}

	initTournamentData = (startDate: number, id: number) => {
		// this.usersPool = [...usersPool];
		this.isStarted = true;
		this.isFinished = false;
		this.startDate = startDate;
		this.tournament = {id: id, rating: {}, matches: []}
		this.usersPool.forEach(userId => {
			if (this.tournament)
				this.tournament.matches.push({ user: userId, played: new Set()});
		});
	}

	init = async () => {
		const activeTournament = await get_active_tournaments();
		if ('id' in activeTournament)
		{
			const tournamentData = await get_tournaments_data(activeTournament.id);
			if ("tournaments" in tournamentData && tournamentData.tournaments.length)
			{
				this.initTournamentData(tournamentData.tournaments[0].date, tournamentData.tournaments[0].tournament_id);
			}
		}
		const lobbyCheck = async () => {
			if (this.isStarted)
			{
				clearInterval(setLobbyCheck);
			}
			else {
				if (this.usersPool.length < 3)
					return;
				const createNewTournamentResponse = await post_new_tournament(this.usersPool);
				if ("tournament_id" in createNewTournamentResponse)
				{
					this.initTournamentData(createNewTournamentResponse.date, createNewTournamentResponse.tournament_id);
				}
				// this.initTournamentData(Date.now(), )
				// this.tournament = { scores: [], rating: {}, matches: [] };
				// this.usersPool.forEach(userId => {
				// 	if (this.tournament)
				// 		this.tournament.matches.push({ user: userId, played: [], decline: 0 });
				// });
				// this.isStarted = true;
				// this.startDate = Date.now();
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
				const availablePlayers = this.tournament.matches.filter(match => match.played.size < 2
					&& activePlayers.find((id) => id === match.user));
				if (availablePlayers.length < 2)
					return;
				availablePlayers.forEach((match, id) => {
					if (match.played.size >= 2)
						return;
					let nextId = ++id;
					if (nextId === availablePlayers.length)
						return;
					while (nextId < availablePlayers.length) {
						if (match.played.has(availablePlayers[nextId].user))
							nextId++;
						else {
							match.played.add(availablePlayers[nextId].user);
							availablePlayers[nextId].played.add(match.user);
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
		if (userMatch && userMatch.played.has(opponentId)) {
		}
		// const opponentId = level?.matches.find(match =>match.user === userId)?.played.pop();
	}

}
