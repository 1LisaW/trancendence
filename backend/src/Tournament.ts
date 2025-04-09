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
		this.init();
	}

	getTournamentId = () => {
		if (this.tournament)
			return this.tournament.id;
		return 0;
	}

	isUserInTournament = (user_id: number) =>{
		if (this.usersPool.findIndex(user => user === user_id) !== -1)
			return true;
		return false;
	}

	initTournamentData = (startDate: number, id: number) => {
		// this.usersPool = [...usersPool];
		this.isStarted = true;
		this.isFinished = false;
		this.startDate = startDate;
		this.tournament = { id: id, rating: {}, matches: [] }
		this.usersPool.forEach(userId => {
			if (this.tournament)
				this.tournament.matches.push({ user: userId, played: new Set() });
		});
	}

	init = async () => {
		const activeTournament = await get_active_tournaments();
		// db has unfinished tournament
		if ('id' in activeTournament) {
			const tournamentData = await get_tournaments_data(activeTournament.id);
			if ("tournaments" in tournamentData && tournamentData.tournaments.length) {
				const users = tournamentData.tournaments
					.filter((value, idx, array) => array.findIndex(v => v.user_id === value.user_id) === idx)
					.map((item) => {
						return { user_id: item.user_id, rating: item.rating };
					});
				this.usersPool = users.map(user => user.user_id);
				this.initTournamentData(tournamentData.tournaments[0].date, tournamentData.tournaments[0].tournament_id);
				// set users rating from db
				users.forEach(user => {
					this.tournament!.rating[user.user_id] = user.rating;
				});
				// set users matches opponents from db
				if (this.tournament && this.tournament.matches) {
					tournamentData.tournaments.forEach(tournament => {
						let match = this.tournament!.matches.find((match) => match.user === tournament.user_id);
						if (!match) {
							this.tournament!.matches.push({ user: tournament.user_id, played: new Set() });
							match = this.tournament!.matches[this.tournament!.matches.length - 1];
						}
						match.played.add(tournament.user_id === tournament.first_user_id ? tournament.second_user_id : tournament.first_user_id);
					})
				}
			}
		}
		const lobbyCheck = async () => {
			if (this.isStarted) {
				clearInterval(setLobbyCheck);
				this.matchmaking();
			}
			else {
				if (this.usersPool.length < 3)
					return;
				const createNewTournamentResponse = await post_new_tournament(this.usersPool);
				if ("tournament_id" in createNewTournamentResponse) {
					this.initTournamentData(createNewTournamentResponse.date, createNewTournamentResponse.tournament_id);
				}
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
							// match.played.add(availablePlayers[nextId].user);
							// availablePlayers[nextId].played.add(match.user);
							this.users.setMatchmakingStateToUser(match.user);
							this.users.setMatchmakingStateToUser(availablePlayers[nextId].user);
							this.users.getChatUserSocketById(match.user)?.forEach(socket => socket.send(JSON.stringify({ type: 'matchmaking', opponentId: availablePlayers[nextId].user })));
							this.users.getChatUserSocketById(availablePlayers[nextId].user)?.forEach(socket => socket.send(JSON.stringify({ type: 'matchmaking', opponentId: match.user })));
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
