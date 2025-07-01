import { get_active_tournaments, get_tournaments_data } from "../api";
import { ChatTournamentMessage } from "../model";
import { Users } from "../Users";
import TournamentSession from "./TournamentSession";


enum TournamentState {
	NOT_STARTED = 'not_started',
	MATCHMAKING = 'matchmaking',
	FINISHED = 'finished',}

const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60; // 1 minute
const TOURNAMENT_EXPIRE_PERIOD = 1000 * 60 * 15; // 15 minutes
export default class TournamentSessionManager {
	private tournamentSession: TournamentSession;
	private users: Users;
	private state: TournamentState = TournamentState.NOT_STARTED;

	constructor(users: Users) {
		this.users = users;
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
				this.state = TournamentState.MATCHMAKING;
			}
		}
	}


	// startTournamentSession = () => {
		// this.isStarted = true;
	// }
	checkLobbyOnEnoughAmount = () => {
		return (this.tournamentSession.isPlayersEnough());
	}

	checkTournamentOnFinishedCondition = () => {
		return (this.tournamentSession.isReadyToFinish());
	}


	startNewLoop = () => {
		if (this.state !== TournamentState.NOT_STARTED)
			return;
		const goToSessionState = async () => {
			if (this.state === TournamentState.FINISHED) {
				clearInterval(sessionStateUpdateCheck);
				this.state = TournamentState.NOT_STARTED;
				return;
			}
			else {
				switch (this.state) {
					// no actions till we reach enough users in lobby
					case TournamentState.NOT_STARTED:
						if (this.checkLobbyOnEnoughAmount()) {
							this.state = TournamentState.MATCHMAKING;
							// this.tournamentSession.startDate = Date.now();
							// this.isStarted = true;
							// this.tournamentSession.isFinished = false;
							// console.log("Tournament started");
						}
						break;
					// matchmaking
					case TournamentState.MATCHMAKING:
						if (this.checkTournamentOnFinishedCondition()) {
							this.state = TournamentState.FINISHED;
						} else {
							this.tournamentSession.matchmakingIteration(this.users.getOnlineUsers());
						}
						break;
				}
			}

		}
		const sessionStateUpdateCheck = setInterval(goToSessionState, TOURNAMENT_LOBBY_CHECK_PERIOD)
	}

	handleChatMessage(user_id: number, msg: ChatTournamentMessage) {
		switch (msg.event) {
			case 'invite':
				// handle invite to tournament
				this.tournamentSession.handleUsersParticipation(msg.tournament_id, user_id);

				break;
			case 'matchmaking':
				// handle matchmaking request
				this.tournamentSession.handleMatchmaking(msg.tournament_id, user_id, msg.reply);
				break;

		}
	}

	onNewUserConnection(user_id: number) {
		if (this.tournamentSession.isUserInTournament(user_id)) {
			const invitation = {
				recipient: 'tournament',
				tournament_id: this.tournamentSession.getId(),
				event: 'invite',
				time: Date.now()
			};
			this.users.sendDataToChatSockets(user_id, invitation);
		}
	}

	handleGameMessage(msg: string) {

	}

	// updateMatchData = (user_id: number, opponent_id: number) => {
	// 	this.tournamentSession.matches.addUserPlayed(user_id, opponent_id);
	// }



}
