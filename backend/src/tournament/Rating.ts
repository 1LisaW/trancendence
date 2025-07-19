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

	getPlace(userId:number): number {
		const rating = {};
		const usersRating = this.getRating(userId);
		// const ratings: {rating:number, users: number[]} = [];
		// Object.entries(this.ratings).forEach((key, val) => {
		 for (const [key, val] of Object.entries(this.ratings)){
			if (val in rating)
				rating[val].push(key);
			else
				rating[val] = [key];
		};
		const place = Object.keys(rating).sort(()=> -1).findIndex((el) => Number(el) == usersRating) + 1;
		return place;
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
