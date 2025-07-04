
interface TournamentMatchmaking {
	first_user_id: number,
	second_user_id: number,
	first_user_response: TournamentMatchmakingResponse,
	second_user_response: TournamentMatchmakingResponse,
}

enum TournamentMatchmakingResponse {
	UNDEFINED = -1,
	DECLINE = 0,
	ACCEPT = 1,
}

export default class TournamentMatchmakingPool {
	private pool: TournamentMatchmaking[] = [];

	private getMatchmakingByUserId(user_id: number): TournamentMatchmaking | undefined {
		const match = this.pool
			.find(match => match.first_user_id === user_id
				|| match.second_user_id === user_id);
		return match;
	}

	add(first_user_id: number, second_user_id: number) {
		const newMatch = {
			first_user_id,
			second_user_id,
			first_user_response: TournamentMatchmakingResponse.UNDEFINED,
			second_user_response: TournamentMatchmakingResponse.UNDEFINED,
		};
		this.pool.push(newMatch);
	}

	update(user_id: number, response: number) {
		const match = this.getMatchmakingByUserId(user_id);
		if (match === undefined)
			return null;
		if (match.first_user_id === user_id)
			match.first_user_response = response;
		else
			match.second_user_response = response;
		if (match.first_user_response === TournamentMatchmakingResponse.UNDEFINED
				|| match.second_user_response === TournamentMatchmakingResponse.UNDEFINED)
			return null;
		return {
			first_user_id: match.first_user_id,
			second_user_id: match.second_user_id,
			first_user_response: match.first_user_response,
			second_user_response: match.second_user_response
		};
	}

	delete(user_id: number) {
		const match = this.getMatchmakingByUserId(user_id);
		if (match === undefined)
			return;
		this.pool = this.pool.filter(m => m !== match);
	}

	find(user_id) {
		const matchmakingRecord = this.pool.filter( elem => elem.first_user_id === user_id || elem.second_user_id === user_id);
	}

}
