import { SCORE_TournamentDataDTO } from "../model";
import { Tournament } from "../Tournament";
import Ratings from "./Rating";
import TournamentMatches from "./TournamentMatches";
import TournamentMatchmakingPool from "./TournamentMatchmakingPool";

class TournamentSession {

	private id: number = 0;

	startDate: number;

	private ratings: Ratings;
	private matches: TournamentMatches;
	private matchmakingPool: TournamentMatchmakingPool;

	constructor() {
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
		this.usersPool = users.map(user => user.user_id);
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




}

export default TournamentSession;
// export { Session as TournamentSession };
