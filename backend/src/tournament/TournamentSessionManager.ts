import { delete_tournament, get_active_tournaments, get_tournaments_data, post_new_tournament, post_tournament_finish } from "../api";
import { ChatTournamentMessage, Status } from "../model";
import { Users } from "../Users";
import TournamentSession from "./TournamentSession";


enum TournamentState {
	NOT_STARTED = 'not_started',
	MATCHMAKING = 'matchmaking',
	FINISHED = 'finished',
}

const TOURNAMENT_LOBBY_CHECK_PERIOD = 1000 * 60 / 4; // 1 minute // 15 sec
const TOURNAMENT_EXPIRE_PERIOD = 1000 * 60 * 15; // 15 minutes
export default class TournamentSessionManager {
	private tournamentSession: TournamentSession;
	private users: Users;
	private state: TournamentState = TournamentState.NOT_STARTED;
	private logging: boolean = true;

	constructor(users: Users) {
		this.users = users;
		this.tournamentSession = new TournamentSession();
		this.syncTournamentDataWithDB();
	}

	log = (msg: string) => {
		if (this.logging) {
			console.log(" 🎠 [TournamentSessionManager]: ", msg);
		}
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
				this.log("🎡 Before start new loop from syncTournamentDataWithDB");
				this.log(JSON.stringify(tournaments));
				this.startNewLoop();
			}
		}
	}

	checkLobbyOnEnoughAmount = () => {
		return (this.tournamentSession.isPlayersEnough() && this.users.getOnlineUsers().length >= 2);
	}

	checkTournamentOnFinishedCondition = () => {
		return (this.tournamentSession.isReadyToFinish());
	}

	startNewLoop = () => {
		this.state = TournamentState.NOT_STARTED;

		const goToSessionState = async () => {
			if (this.state === TournamentState.FINISHED) {
				clearInterval(sessionStateUpdateCheck);
				this.state = TournamentState.NOT_STARTED;
				this.tournamentSession.clear();
				return;
			}
			else {
				switch (this.state) {
					// no actions till we reach enough users in lobby
					case TournamentState.NOT_STARTED:
						if (this.checkLobbyOnEnoughAmount()) {
							this.log("🔴 state not_started -> matchmaking");
							this.state = TournamentState.MATCHMAKING;
							if (!this.tournamentSession.getId()) {
								await this.onTournamentStart();

							}
						} else {
							this.log("🔵 state not_started");
							break;
						}
					// matchmaking
					case TournamentState.MATCHMAKING:
						if (this.checkTournamentOnFinishedCondition()) {
							this.log("🔴🔴 state matchmaking -> finished");
							this.state = TournamentState.FINISHED;
							const tournament_id = this.tournamentSession.getId();
							if (tournament_id === 0) {
								this.log("🔴🔴🔴 No tournament id, clearing session");
								delete_tournament(tournament_id);
							} else {
								post_tournament_finish(tournament_id);
							}
							this.tournamentSession.clear();
						} else {
							this.log("🔵 state matchmaking");
							this.tournamentSession.matchmakingIteration(this.users);
							break;
						}
				}
			}

		}
		const sessionStateUpdateCheck = setInterval(goToSessionState, TOURNAMENT_LOBBY_CHECK_PERIOD);
		goToSessionState();
	}

	handleChatMessage(user_id: number, msg: ChatTournamentMessage) {
		switch (msg.event) {
			case 'invite':
				// handle invite to tournament
				this.tournamentSession.handleUsersParticipationMessage(msg.tournament_id, user_id);
				// start loop if first user joined
				if (this.tournamentSession.usersPool.size === 1) {
					this.log("🎡 Starting new tournament loop after first user joined");
					this.tournamentSession.startDate = Date.now();
					this.startNewLoop();
				}
				break;
			case 'matchmaking':
				// handle matchmaking request
				this.tournamentSession.handleMatchmakingMessage(msg.tournament_id, user_id, msg.reply, this.users);
				break;
		}
	}

	onNewUserConnection(user_id: number) {
		this.log(`New user connected: ${user_id}`);
		if (!this.tournamentSession.isUserInTournament(user_id)) {
			const invitation = {
				recipient: 'tournament',
				tournament_id: this.tournamentSession.getId(),
				event: 'invite',
				time: Date.now()
			};
			this.users.sendDataToChatSockets(user_id, invitation);
		}
	}

	onTournamentStart = async () => {
		this.log("🎡 Tournament started");
		const data = await post_new_tournament(Array.from(this.tournamentSession.usersPool));
		if ('tournament_id' in data) {
			this.tournamentSession.setId(data.tournament_id);
			this.tournamentSession.usersPool.forEach(user_id => {
				if (this.users.getUserStatus(user_id) !== Status.OFFLINE) {
					const message = {
						recipient: 'tournament',
						tournament_id: this.tournamentSession.getId(),
						event: 'start',
						time: data.date,
					};
					this.users.sendDataToChatSockets(user_id, message);

				this.log("🎡 New tournament session started with id: " + data.tournament_id);
				} else {
					this.log("🔴 Error creating new tournament session: " + JSON.stringify(data));
				}
			})
		}
	}

	onGameResult = (players: number[], score:number[]) => {
		this.tournamentSession.onGameResult(players, score);
	}
}
