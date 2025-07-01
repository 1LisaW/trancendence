import { post_new_tournament } from "../api";
import { SCORE_TournamentDataDTO } from "../model";
import { Tournament } from "../Tournament";
import { Users } from "../Users";
import Ratings from "./Rating";
import TournamentMatches from "./TournamentMatches";
import TournamentMatchmakingPool from "./TournamentMatchmakingPool";


const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60; // 1 minute
const TOURNAMENT_EXPIRE_PERIOD = 1000 * 60 * 15; // 15 minutes
class TournamentSession {

	private id: number = 0;

	private isStarted: boolean = false;
	private isFinished: boolean = false;
	startDate: number;
	usersPool: Set<number>;

	private ratings: Ratings;
	private matches: TournamentMatches;
	private matchmakingPool: TournamentMatchmakingPool;

	static MIN_AMOUNT_OF_PLAYERS = 3;

	constructor() {
		this.startDate = Date.now();
		this.usersPool = new Set<number>();

		this.ratings = new Ratings();
		this.matches = new TournamentMatches();
		this.matchmakingPool = new TournamentMatchmakingPool();
	}

	init(tournaments: SCORE_TournamentDataDTO[]) {
		if (tournaments.length == 0)
			return;
		this.id = tournaments[0].tournament_id;
		this.startDate = tournaments[0].date;


		const users = tournaments
			.filter((value, idx, array) => array.findIndex(v => v.user_id === value.user_id) === idx)
			.map((item) => {
				return { user_id: item.user_id, rating: item.rating };
			});
		this.usersPool = new Set(users.map(user => user.user_id));
		// this.initTournamentData(tournamentData.tournaments[0].date, tournamentData.tournaments[0].tournament_id);
		// set users rating from db
		this.ratings.init(users);
		// users.forEach(user => {
		// 	if (this.tournament)

		// 		this.tournament.setUsersRating(user.user_id, user.rating);
		// });
		// set users matches opponents from db
		const usersMatches = tournaments.filter((value) => value.first_user_id !== null && value.second_user_id !== null);
		this.matches.init(usersMatches);
	}
	getId = () => {
		return this.id;
	}

	// private goToFillingOfLobbyCheck() {
	// 	const lobbyCheck = async () => {
	// 				if (this.isStarted) {
	// 					clearInterval(setLobbyCheck);
	// 				}
	// 				else {
	// 					if (this.usersPool.size < 3)
	// 						return;
	// 					const createNewTournamentResponse = await post_new_tournament([...this.usersPool]);
	// 					if ("tournament_id" in createNewTournamentResponse) {
	// 						this.id = createNewTournamentResponse.tournament_id;
	// 						this.startDate = createNewTournamentResponse.date;
	// 						this.isStarted = true;
	// 						// this.onSessionStart(createNewTournamentResponse.date, createNewTournamentResponse.tournament_id);
	// 						this.goToMatchmaking();
	// 					}
	// 				}
	// 	}
	// 	const setLobbyCheck = setInterval(lobbyCheck, TOURNAMENT_LOBBY_CHECK_PERIOD)
	// }

	// goToMatchmaking = (users: Users) => {
	// 	const matchmakingCheck = () => {
	// 		if (this.isFinished) {
	// 			clearInterval(setMatchmakingCheck);
	// 		}
	// 		const activePlayers = this.getActivePlayers();
	// 		if (!activePlayers)
	// 			return;

	// 		let pair: number[] | null = null;
	// 		while (pair = this.getTournamentPair()) {
	// 			const matchmaking: TournamentMatchmaking = {
	// 				first_user_id: pair[0],
	// 				second_user_id: pair[1],
	// 				first_user_response: -1,
	// 				second_user_response: -1
	// 			};
	// 			this.matchmakingPool.add(matchmaking.first_user_id, matchmaking.second_user_id);
	// 			const time = Date.now();
	// 			pair.forEach((userId, id) => {
	// 				this.users.setMatchmakingStateToUser(userId);
	// 				const message = {
	// 					recipient: 'tournament',
	// 					tournament_id: this.getId(),
	// 					event: 'matchmaking',
	// 					time: time,
	// 					opponent_name: this.users.getUserNameById(pair?.at[id === 0 ? 1 : 0])
	// 				}
	// 				this.users.sendDataToChatSockets(userId, message);
	// 			})
	// 		}
	// 		if (this.checkTournamentOnFinishedCondition())
	// 			this.goToEndTournament();
	// 	}
	// 	const setMatchmakingCheck = setInterval(matchmakingCheck, TOURNAMENT_LOBBY_CHECK_PERIOD);
	// }

	matchmakingIteration = (onlineUsers: number[]) => {

	}


	handleUsersParticipation = (tournament_id:number, user_id: number) => {
		if (this.getId() !== tournament_id)
			return;
		this.usersPool.add(user_id);
		// if (this.usersPool.size === 1)
			// this.goToFillingOfLobbyCheck();
	}

	handleMatchmaking = (tournament_id:number, user_id: number, reply: boolean) => {

	}

	handleMatch = () => {

	}

	isUserInTournament = (user_id: number): boolean => {
		return this.usersPool.has(user_id);
	}
	// sendInvitationToUser = () => {}

	isPlayersEnough = () => {
		return (this.usersPool.size >= TournamentSession.MIN_AMOUNT_OF_PLAYERS);
	}

	isReadyToFinish = () => {
		if (this.isPlayersEnough() && this.matches.isAllPlayed())
			return (true);
		const diff = this.startDate + TOURNAMENT_EXPIRE_PERIOD;
		if (diff < Date.now())
			return (true);
		return (false);
	}


}

export default TournamentSession;
// export { Session as TournamentSession };
