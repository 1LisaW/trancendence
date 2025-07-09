import { post_matchmaking_with_specific_user__game_service, post_new_tournament, post_new_tournament_score, post_new_tournament_user, ScoreRequestBody } from "../api";
import { MatchOptions, SCORE_TournamentDataDTO, Status } from "../model";
import { Tournament } from "../Tournament";
import { Users } from "../Users";
import Ratings from "./Rating";
import TournamentMatches from "./TournamentMatches";
import TournamentMatchmakingPool from "./TournamentMatchmakingPool";


const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60; // 1 minute
const TOURNAMENT_EXPIRE_PERIOD = 1000 * 60 * 15; // 15 minutes

interface TournamentMatchmaking {
	first_user_id: number,
	second_user_id: number,
	first_user_response: number,
	second_user_response: number,
}

class TournamentSession {

	private id: number = 0;

	// private isStarted: boolean = false;
	// private isFinished: boolean = false;
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
		this.id = tournaments[0].tournament_id ? tournaments[0].tournament_id : 0;
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

	clear() {
		this.id = 0;
		this.startDate = Date.now();
		this.usersPool.clear();
		this.ratings = new Ratings();
		this.matches = new TournamentMatches();
		this.matchmakingPool = new TournamentMatchmakingPool();
	}
	getId = () => {
		return this.id;
	}

	setId = (id: number) => {
		this.id = id;
	}

	matchmakingIteration = (users: Users) => {
		const onlineUsers = users.getOnlineUsers();
		if (onlineUsers.length === 0)
			return;
		let pair: number[] | null = null;
		while (pair = this.matches.getUnplayedPairFromCollection(users.getOnlineUsers())) {
			const matchmaking: TournamentMatchmaking = {
				first_user_id: pair[0],
				second_user_id: pair[1],
				first_user_response: -1,
				second_user_response: -1
			};
			this.matchmakingPool.add(matchmaking.first_user_id, matchmaking.second_user_id);
			const time = Date.now();
			pair.forEach((userId, id) => {
				users.setMatchmakingStateToUser(userId);
				const message = {
					recipient: 'tournament',
					tournament_id: this.getId(),
					event: 'matchmaking',
					time: time,
					opponent_name: users.getUserNameById(pair?.at[id === 0 ? 1 : 0])
					// opponentId: pair?.at(id === 0 ? 1 : 0),
				}
				users.sendDataToChatSockets(userId, message);
			})
		}
	}

	handleUsersParticipationMessage = (tournament_id: number, user_id: number) => {
		if (this.getId() !== tournament_id)
			return;
		this.usersPool.add(user_id);
		this.matches.initUserMatch(user_id);
		this.ratings.setRating(user_id, 0);
		if (tournament_id)
			post_new_tournament_user(tournament_id, user_id);
	}

	onGameResult = (players: number[], score:number[]) => {
		this.matches.addMatch(players[0], players[1]);
		this.ratings.incrementRating(players[0], score[0]);
		this.ratings.incrementRating(players[1], score[1]);

		this.matchmakingPool.delete(players[0]);
	}

	handleMatchmakingMessage = (tournament_id: number, user_id: number, reply: boolean, users: Users) => {
		if (this.getId() !== tournament_id)
			return;

		const matchmakingRecord = this.matchmakingPool.update(user_id, reply ? 1 : 0);
		if (!matchmakingRecord)
			return;

		if (matchmakingRecord.first_user_response && matchmakingRecord.second_user_response) {
			// TODO:: send each user response about the start of the game
			console.log('start tournament!! game');
			const data = {
				recipient: 'tournament',
				tournament_id: this.getId(),
				event: 'match',
				time: Date.now(),
				opponent_name: users.getUserNameById(matchmakingRecord.second_user_id),
				opponentId: matchmakingRecord.second_user_id,
				isInitiator: true,
			}

			this.matchmakingPool.delete(matchmakingRecord.first_user_id);

			users.sendDataToChatSockets(matchmakingRecord.first_user_id, data);
			data.opponent_name = users.getUserNameById(matchmakingRecord.first_user_id);
			data.opponentId = matchmakingRecord.first_user_id;
			data.isInitiator = false;
			users.sendDataToChatSockets(matchmakingRecord.second_user_id, data);

			//TODO::
			//
			// setTimeout(() => post_matchmaking_with_specific_user__game_service(matchmakingRecord.first_user_id, 'tournament', matchmakingRecord.second_user_id), 1000);


		}
		// some of users disagreed to play
		else {
			// technical forfeit guarantee the winner 3 points and looser 0 points
			// join response: (false, false) gives (+0, +0)
			// (true, false) gives (+3, +0)
			// (false, true) gives (+0, +3)

			let first_user_result = MatchOptions.FORFEIT;
			let second_user_result = MatchOptions.FORFEIT;

			if (matchmakingRecord.first_user_response === 1 && matchmakingRecord.second_user_response === 0) {
				first_user_result = MatchOptions.TECHNICAL_WIN;
				second_user_result = MatchOptions.FORFEIT;
			} else if (matchmakingRecord.first_user_response === 0 && matchmakingRecord.second_user_response === 1) {
				first_user_result = MatchOptions.FORFEIT;
				second_user_result = MatchOptions.TECHNICAL_WIN;
			}

			const data: ScoreRequestBody = {
				first_user_id: matchmakingRecord.first_user_id,
				second_user_id: matchmakingRecord.second_user_id,
				first_user_name: users.getUserNameById(matchmakingRecord.first_user_id) || '',
				second_user_name: users.getUserNameById(matchmakingRecord.second_user_id) || '',
				game_results: [first_user_result,second_user_result],
				score: [
					matchmakingRecord.first_user_response ? 3 : 0,
					matchmakingRecord.second_user_response ? 3 : 0
				],
				game_mode: 'tournament'
			};
			post_new_tournament_score(this.getId(), data);

			this.matches.addMatch(data.first_user_id, data.second_user_id);
			this.ratings.incrementRating(data.first_user_id, data.score[0]);
			this.ratings.incrementRating(data.second_user_id, data.score[1]);

			this.matchmakingPool.delete(data.first_user_id);

			if (users.getUserStatus(data.first_user_id) === Status.MATCHMAKING)
				users.setOnlineStatusToUser(data.first_user_id);
			if (users.getUserStatus(data.second_user_id) === Status.MATCHMAKING)
				users.setOnlineStatusToUser(data.second_user_id);

			const time = Date.now();
			const user_response = {
				recipient: 'tournament',
				tournament_id: this.getId(),
				event: 'match_result',
				time: time,
			}

			const first_user_response = {
				...user_response,
				opponent: users.getUserNameById(data.second_user_id),
				option: matchmakingRecord.first_user_response === 1 ? MatchOptions.TECHNICAL_WIN : MatchOptions.FORFEIT
			};
			users.sendDataToChatSockets(matchmakingRecord.first_user_id, first_user_response);

			const second_user_response = {
				...user_response,
				opponent: users.getUserNameById(data.first_user_id),
				option: matchmakingRecord.second_user_response === 1 ? MatchOptions.TECHNICAL_WIN : MatchOptions.FORFEIT
			}
			users.sendDataToChatSockets(data.second_user_id, second_user_response);
		}
	}

	handleMatchMessage = (data: ScoreRequestBody) => {

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
