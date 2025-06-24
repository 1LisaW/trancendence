export interface UserRating {
	user_id: number;
	rating: number;
}

export default class Ratings {
	private ratings: Record<number, number> = {};

	constructor() {
		this.ratings = {};
	}

	init(userRatings: UserRating[]): void {
		this.ratings = {};
		for (const userRating of userRatings) {
			this.ratings[userRating.user_id] = userRating.rating;
		}
	}

	getRating(userId: number): number {
		return this.ratings[userId] || 0;
	}

	setRating(userId: number, value: number): void {
		this.ratings[userId] = value;
	}

	incrementRating(userId: number, value: number): void {
		if (!this.ratings[userId]) {
			this.setRating(userId, 0);
		}
		this.ratings[userId] += value;
	}

}
