import { get_active_tournaments, get_tournaments_data } from "../api";
import TournamentSession from "./TournamentSession";

class TournamentSessionManager {
	private tournamentSession: TournamentSession;
	private isStarted: boolean = false;

	constructor() {
		this.tournamentSession = new TournamentSession();
	}

	syncTournamentDataWithDB = async () => {
		const activeTournament = await get_active_tournaments();
		if ('tournament' in activeTournament) {
			console.log("Tournament: activeTournament", activeTournament);
			const tournamentData = await get_tournaments_data(activeTournament.tournament.id);
			console.log("Tournament: tournamentData", tournamentData);
			if ("tournaments" in tournamentData && tournamentData.tournaments.length) {
				const tournaments = tournamentData.tournaments;
				this.tournamentSession.init(tournaments);
			}
		}
	}

	updateMatchData = (user_id: number, opponent_id: number) => {
		this.tournamentSession.matches.addUserPlayed(user_id, opponent_id);
	}



}
