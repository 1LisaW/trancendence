import { get_active_tournaments, get_tournaments_data, post_new_tournament } from "./api";
import { ChatTournamentMessage, MatchOptions, SCORE_TournamentDataDTO, Status } from "./model";
import { Users } from "./Users";

interface Match {
	user: number,
	played: Set<number>,
}

interface TournamentMatchmaking {
	first_user_id: number,
	second_user_id: number,
	first_user_response: number,
	second_user_response: number,
}
interface TournamentState {
	id: number;
	rating: Record<number, number>,
	matches: Match[],
	matchmakingPool: TournamentMatchmaking[];
	// scores: Record<number, number>[],
}
const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60; // 1 minute
const TOURNAMENT_EXPIRE_PERIOD = 1000 * 60 * 15; // 15 minutes

class TournamentMatches {
	private matches: Match[];
	constructor() {
		this.matches = [];
	}

	init = (users: number[]) => {
		users.forEach(userId => {
			this.matches.push({ user: userId, played: new Set() });
		});
	}

	clear = () => {
		this.matches = [];
	}

	initUserMatch = (user_id: number) => {
		const match = { user: user_id, played: new Set<number>() };
		this.matches.push(match);
		return match;
	}

	getAll = () => {
		return this.matches;
	}
	getByUser = (user_id: number) => {
		return this.matches.find(match => match.user === user_id);
	}

	addUserPlayed = (user_id: number, opponent_id: number) => {
		let match = this.matches.find(match => match.user === user_id);
		if (!match)
			match = this.initUserMatch(user_id);
		match.played.add(opponent_id);
	}

	getUnplayedPairFromCollection = (usersPool: number[]) => {
		let pair: number[] | null = null;

		let online_users = [...usersPool];

		while (online_users.length && !pair) {
			const rest_users = online_users.slice(1);
			const userMatches = this.getByUser(online_users[0]);
			if (userMatches) {
				const opponentId = rest_users.find(user => (
					!userMatches.played.has(user)
				));
				if (opponentId)
					pair = [online_users[0], opponentId];
			}
			online_users = rest_users;
		}
		return pair;
	}

	isAllPlayed = () => {
		return this.matches.every(({ played }) => played.size === this.matches.length - 1);
	}
}
class TournamentData {
	private id: number;
	private rating: Record<number, number>;
	matches: TournamentMatches;
	matchmakingPool: TournamentMatchmaking[];
	constructor() {
		this.id = 0;
		this.rating = {};
		this.matches = new TournamentMatches();
		this.matchmakingPool = [];
	}

	getId = () => {
		return this.id;
	}

	getUsersRating = (user_id: number) => {
		return this.rating[user_id] || 0;
	}

	setUsersRating = (user_id: number, rating: number) => {
		this.rating[user_id] = rating;
	}

	initUserData = (user_id: number) => {
		this.matches.initUserMatch(user_id);
		this.rating[user_id] = 0;
	}

	initFromDB = (tournaments: SCORE_TournamentDataDTO[]) => {
		if (tournaments.length === 0) {
			return;
		}
		// get unique users data {user_id, rating} from tournaments
		const users = tournaments
			.filter((value, idx, array) => array.findIndex(v => v.user_id === value.user_id) === idx)
			.map((item) => {
				return { user_id: item.user_id, rating: item.rating };
			});
		this.id = tournaments[0].tournament_id;
		// set users rating from db
		users.forEach(user => {
			this.rating[user.user_id] = user.rating;
		});

		// set users matches opponents from db
		tournaments.forEach(tournament => {
			const opponent_id = tournament.user_id === tournament.first_user_id ? tournament.second_user_id : tournament.first_user_id;
			this.matches.addUserPlayed(tournament.user_id, opponent_id);
		})
	}

	clear = () => {
		this.id = 0;
		this.rating = {};
		this.matches.clear();
		this.matchmakingPool = [];
	}

	init = (tournament_id: number, users: number[]) => {
		this.id = tournament_id;
		this.rating = {};
		users.forEach(userId => {
			this.rating[userId] = 0;
		});
		this.matches.init(users);
		this.matchmakingPool = [];
	}
}

export class Tournament {
	private isStarted: boolean;
	private isFinished: boolean;
	private usersPool: number[] = [];
	private startDate: number;
	private users: Users;
	private tournament = new TournamentData();

	constructor(users: Users) {
		this.isStarted = false;
		this.isFinished = false;
		this.usersPool = [];
		this.startDate = Date.now();
		this.users = users;
		this.init();
	}

	onNewSessionCreate = () => {
		this.isStarted = false;
		this.isFinished = false;
		this.usersPool = [];
		this.startDate = Date.now();
	}

	onSessionStart = (time: number, tournament_id: number) => {
		this.isStarted = true;
		this.isFinished = false;
		this.startDate = time;
		this.tournament.init(tournament_id, this.usersPool);
	}

	onSessionEnd = () => {
		this.isStarted = false;
		this.isFinished = true;
		this.usersPool = [];
		this.startDate = Date.now();
		this.tournament.clear();
	}

	getTournamentId = () => {
		return this.tournament.getId();
	}

	isUserInTournament = (user_id: number) => {
		if (this.usersPool.findIndex(user => user === user_id) !== -1)
			return true;
		return false;
	}



	initTournamentData = (startDate: number, tournament_id: number) => {
		this.isStarted = true;
		this.isFinished = false;
		this.startDate = startDate;
		this.tournament.init(tournament_id, this.usersPool);
	}

	syncTournamentDataWithDB = async () => {
		const activeTournament = await get_active_tournaments();
		if ('tournament' in activeTournament) {
			console.log("Tournament: activeTournament", activeTournament);
			const tournamentData = await get_tournaments_data(activeTournament.tournament.id);
			console.log("Tournament: tournamentData", tournamentData);
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
					if (this.tournament)
						this.tournament.setUsersRating(user.user_id, user.rating);
				});
				// set users matches opponents from db
				const usersMatches = tournamentData.tournaments.filter((value) => value.first_user_id !== null && value.second_user_id !== null);
				usersMatches.forEach(usersMatch => {
					const opponent_id = usersMatch.user_id === usersMatch.first_user_id ? usersMatch.second_user_id : usersMatch.first_user_id;
					this.tournament.matches.addUserPlayed(usersMatch.user_id, opponent_id);
				})
			}
		}
	}

	init = async () => {
		await this.syncTournamentDataWithDB();
		if (this.isStarted) {
			this.goToMatchmaking();
			return;
		}
		// const activeTournament = await get_active_tournaments();
		// db has unfinished tournament
		// if ('id' in activeTournament) {
		// 	const tournamentData = await get_tournaments_data(activeTournament.id);
		// 	if ("tournaments" in tournamentData && tournamentData.tournaments.length) {
		// 		const users = tournamentData.tournaments
		// 			.filter((value, idx, array) => array.findIndex(v => v.user_id === value.user_id) === idx)
		// 			.map((item) => {
		// 				return { user_id: item.user_id, rating: item.rating };
		// 			});
		// 		this.usersPool = users.map(user => user.user_id);
		// 		this.initTournamentData(tournamentData.tournaments[0].date, tournamentData.tournaments[0].tournament_id);
		// 		// set users rating from db
		// 		users.forEach(user => {
		// 			if (this.tournament)
		// 				this.tournament.setUsersRating(user.user_id, user.rating);
		// 		});
		// 		// set users matches opponents from db
		// 		tournamentData.tournaments.forEach(tournament => {
		// 			const opponent_id = tournament.user_id === tournament.first_user_id ? tournament.second_user_id : tournament.first_user_id;
		// 			this.tournament.matches.addUserPlayed(tournament.user_id, opponent_id);
		// 		})
		// 		this.goToMatchmaking();
		// 		return;
		// 	}
		// }
		// this.goToFillingOfLobbyCheck();
		// const lobbyCheck = async () => {
		// 	if (this.isStarted) {
		// 		clearInterval(setLobbyCheck);
		// 		this.matchmaking();
		// 	}
		// 	else {
		// 		if (this.usersPool.length < 3)
		// 			return;
		// 		const createNewTournamentResponse = await post_new_tournament(this.usersPool);
		// 		if ("tournament_id" in createNewTournamentResponse) {
		// 			this.initTournamentData(createNewTournamentResponse.date, createNewTournamentResponse.tournament_id);
		// 		}
		// 	}
		// }
		// const setLobbyCheck = setInterval(lobbyCheck, TOURNAMENT_LOBBY_CHECK_PERIOD)
	}

	goToFillingOfLobbyCheck = () => {
		const lobbyCheck = async () => {
			if (this.isStarted) {
				clearInterval(setLobbyCheck);
			}
			else {
				if (this.usersPool.length < 3)
					return;
				const createNewTournamentResponse = await post_new_tournament(this.usersPool);
				if ("tournament_id" in createNewTournamentResponse) {
					this.onSessionStart(createNewTournamentResponse.date, createNewTournamentResponse.tournament_id);
					this.goToMatchmaking();
				}
			}
		}
		const setLobbyCheck = setInterval(lobbyCheck, TOURNAMENT_LOBBY_CHECK_PERIOD)
	}

	goToMatchmaking = () => {
		const matchmakingCheck = () => {
			if (this.isFinished) {
				clearInterval(setMatchmakingCheck);
			}
			const activePlayers = this.getActivePlayers();
			if (!activePlayers)
				return;

			let pair: number[] | null = null;
			while (pair = this.getTournamentPair()) {
				const matchmaking: TournamentMatchmaking = {
					first_user_id: pair[0],
					second_user_id: pair[1],
					first_user_response: -1,
					second_user_response: -1
				};
				this.tournament.matchmakingPool.push(matchmaking);
				const time = Date.now();
				pair.forEach((userId, id) => {
					this.users.setMatchmakingStateToUser(userId);
					const message = {
						recipient: 'tournament',
						tournament_id: this.getTournamentId(),
						event: 'matchmaking',
						time: time,
						opponent_name: this.users.getUserNameById(pair?.at[id === 0 ? 1 : 0])
					}
					this.users.sendDataToChatSockets(userId, message);
				})
			}
			if (this.checkTournamentOnFinishedCondition())
				this.goToEndTournament();
		}
		const setMatchmakingCheck = setInterval(matchmakingCheck, TOURNAMENT_LOBBY_CHECK_PERIOD);
	}

	goToEndTournament = () => {
		this.usersPool.forEach(userId => {
			const message = {
				recipient: 'tournament',
				tournament_id: this.tournament.getId(),
				event: 'finish',
				time: Date.now(),
				canceled: this.isFinished,
				rating: this.tournament.getUsersRating(userId)
			}
			this.users.sendDataToChatSockets(userId, message);
		})
		this.onSessionEnd();
	}

	addUserToPool(tournament_id: number, user_id: number) {
		if (this.tournament.getId() !== tournament_id)
			return;
		this.usersPool.push(user_id);
		this.tournament.initUserData(user_id);

		// start monitoring filling of lobby if first user joined
		if (this.usersPool.length === 1)
			this.goToFillingOfLobbyCheck();
	}

	private getTournamentPair = () => {
		const online_users = this.usersPool.filter(user_id => this.users.getUserStatus(user_id) === Status.ONLINE);
		return this.tournament.matches.getUnplayedPairFromCollection(online_users);
	}

	private checkTournamentOnFinishedCondition = () => {
		const usersAmount = this.usersPool.length;

		// check if there are enough users and all users played with each other
		if (usersAmount >= 3 && this.tournament.matches.isAllPlayed()) {
			this.isFinished = true;
			return true;
		}

		// cancel tournament if there are less than 3 users and the tournament is expired
		if (this.startDate + TOURNAMENT_EXPIRE_PERIOD < Date.now()) {
			this.isFinished = true;
			return true;
		}

		return false;
	}

	private getActivePlayers = () => {
		if (this.checkTournamentOnFinishedCondition())
			return null;
		const activePlayers = this.usersPool.filter(user_id => this.users.getUserStatus(user_id) === Status.ONLINE);
		if (activePlayers.length < 2)
			return null;
		return activePlayers;
	}

	matchmaking() {
		const matchmakingCheck = () => {
			if (this.isFinished) {
				clearInterval(setMatchmakingCheck);
			}
			const activePlayers = this.getActivePlayers();
			if (!activePlayers)
				return;

			const tournament = this.tournament;

			let pair: number[] | null = null;
			while (pair = this.getTournamentPair()) {
				const matchmaking: TournamentMatchmaking = {
					first_user_id: pair[0],
					second_user_id: pair[1],
					first_user_response: -1,
					second_user_response: -1
				};
				tournament.matchmakingPool.push(matchmaking);
				const time = Date.now();
				pair.forEach((userId, id) => {
					this.users.setMatchmakingStateToUser(userId);
					const message = {
						recipient: 'tournament',
						tournament_id: this.getTournamentId(),
						event: 'matchmaking',
						time: time,
						opponent_name: this.users.getUserNameById(pair?.at[id === 0 ? 1 : 0])
					}
					this.users.sendDataToChatSockets(userId, message);
				})
			}
		}
		const setMatchmakingCheck = setInterval(matchmakingCheck, TOURNAMENT_LOBBY_CHECK_PERIOD);

	}

	fillMatchResultData(user_id: number, opponent_id: number, users_rating: number, opponents_rating: number) {
		if (!this.tournament)
			return;
		const users_matches = this.tournament.matches.getByUser(user_id);
		const opponents_matches = this.tournament.matches.getByUser(opponent_id);

		if (!users_matches || !opponents_matches)
			return;

		users_matches.played.add(opponent_id);
		opponents_matches.played.add(user_id);
		this.tournament.setUsersRating(user_id, this.tournament.getUsersRating(user_id) + users_rating);
		this.tournament.setUsersRating(opponent_id, this.tournament.getUsersRating(opponent_id) + opponents_rating);
	}

	onMatchmakingResponse(tournament_id: number, user_id: number, join: boolean) {
		if (!this.tournament || this.tournament.getId() !== tournament_id)
			return;
		const curr_matchmaking = this.tournament.matchmakingPool.find((matchmaking) =>
			matchmaking.first_user_id === user_id || matchmaking.second_user_id === user_id
		)
		if (!curr_matchmaking)
			return;

		if (curr_matchmaking.first_user_id === user_id)
			curr_matchmaking.first_user_response = join ? 1 : 0;
		else
			curr_matchmaking.second_user_response = join ? 1 : 0;

		// check on existence of the opponent's response
		if (curr_matchmaking.first_user_response < 0 || curr_matchmaking.second_user_response < 0)
			return;

		// both users agreed to play
		if (curr_matchmaking.first_user_response && curr_matchmaking.second_user_response)
			// send each user response about the start of the game
			console.log('start game');

		// some of users disagreed to play
		else {
			// technical forfeit guarantee the winner 3 points and looser 0 points
			// join response: (false, false) gives (+0, +0)
			// (true, false) gives (+3, +0)
			// (false, true) gives (+0, +3)
			this.fillMatchResultData(
				curr_matchmaking.first_user_id, curr_matchmaking.second_user_id,
				3 * curr_matchmaking.first_user_response, 3 * curr_matchmaking.second_user_response
			);
			this.tournament.matchmakingPool = this.tournament.matchmakingPool
				.filter(matchmaking => matchmaking !== curr_matchmaking);

			if (this.users.getUserStatus(curr_matchmaking.first_user_id) === Status.MATCHMAKING)
				this.users.setOnlineStatusToUser(curr_matchmaking.first_user_id);
			if (this.users.getUserStatus(curr_matchmaking.second_user_id) === Status.MATCHMAKING)
				this.users.setOnlineStatusToUser(curr_matchmaking.second_user_id);
			const time = Date.now();
			const user_response = {
				recipient: 'tournament',
				tournament_id: this.tournament.getId(),
				event: 'match',
				time: time,
			}
			const first_user_response = {
				...user_response,
				opponent: this.users.getUserNameById(curr_matchmaking.second_user_id),
				option: curr_matchmaking.first_user_response === 1 ? MatchOptions.TECHNICAL_WIN : MatchOptions.FORFEIT
			};
			this.users.sendDataToChatSockets(curr_matchmaking.first_user_id, first_user_response);

			const second_user_response = {
				...user_response,
				opponent: this.users.getUserNameById(curr_matchmaking.first_user_id),
				option: curr_matchmaking.second_user_response === 1 ? MatchOptions.TECHNICAL_WIN : MatchOptions.FORFEIT
			}
			this.users.sendDataToChatSockets(curr_matchmaking.second_user_id, second_user_response)

		}
	}

	terminate_matchmaking(userId: number, opponentId: number) {
		if (this.tournament === null)
			return;
		// const level = this.tournament.reverse().find(level => level.matches.find(({ user }) => user === userId));
		const userMatch = this.tournament.matches.getByUser(userId) //.matches.find(match => match.user === userId);
		if (userMatch && userMatch.played.has(opponentId)) {
		}
		// const opponentId = level?.matches.find(match =>match.user === userId)?.played.pop();
	}

	onChatWSMessage = (user_id: number, message: ChatTournamentMessage) => {
		if (message.recipient !== 'tournament')
			return;
		switch (message.event) {
			case 'invite':
				this.addUserToPool(message.tournament_id, user_id);
				break;
			case 'matchmaking':
				this.onMatchmakingResponse(message.tournament_id, user_id, message.reply);
				break;
			default:
				break;
		}
	}

}
