import { SCORE_TournamentDataDTO } from "../model";

interface Match {
	user: number,
	played: Set<number>,
}

export default class TournamentMatches {
	// matches of each user that were played in the tournament or are currently being played
	private matches: Match[];

	constructor() {
		this.matches = [];
	}

	init = (matches: SCORE_TournamentDataDTO[]) => {

		// if no matches, return
		if (matches.length === 0)
			return;

		matches.forEach(usersMatch => {
			const opponent_id = usersMatch.user_id === usersMatch.first_user_id ? usersMatch.second_user_id : usersMatch.first_user_id;
			this.addUserPlayed(usersMatch.user_id, opponent_id);
		})
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

	getUnplayedPairFromCollection = (usersPool: number[]): number[] | null => {
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
