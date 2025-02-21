type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };

type Tuple3<T> = Tuple<T, 3>;

interface SceneProps {
	"ground": {
		"name" : string,
		"width": number,
		"height": number
	},
	"bat": {
		"width": number,
		"height": number,
		"depth": number
	},
	"ball": {
		"name": string,
		"diameter": number
	},
	"player": {
		"name": string,
		"vector": Tuple3<number>,
		"startPosition": Tuple3<number>

	},
	"opponent": {
		"name": string,
		"vector": Tuple3<number>,
		"startPosition": Tuple3<number>
	}
}
let sceneParams = require('../../configuration.json');
sceneParams = sceneParams as SceneProps;
// const data = sceneParams
interface PlayerProp {
	id: string | undefined;
	pos: Tuple3<number>,
	dest: Tuple3<number>,
	speed: number
}
interface BallProp {
	pos: Tuple3<number>,
	// dest: Tuple3<number>,
	speed: number,
	normal: Tuple3<number>,
}
const x_lose_pos = sceneParams.ground.width / 2 + sceneParams.ball.diameter / 2;
const y_wall_collision = sceneParams.ground.height / 2 - sceneParams.ball.diameter / 2;
const x_collision = sceneParams.ground.width / 2 + sceneParams.ball.diameter / 2;
const win_score = 15;

class GameSession {
	private _player: PlayerProp;
	private _opponent: PlayerProp;
	private _ball: BallProp;
	private _score = [0,0];

	constructor(playerId: string, opponentId?: string ) {
		this._player = {
			id: playerId,
			pos: [...sceneParams.player.startPosition] as Tuple3<number>,
			dest: [...sceneParams.player.startPosition] as Tuple3<number>,
			speed: 0
		};
		this._opponent = {
			id: undefined,
			pos: [...sceneParams.opponent.startPosition] as Tuple3<number>,
			dest: [...sceneParams.opponent.startPosition] as Tuple3<number>,
			speed: 0
		};
		this._ball = {
			pos: [0, 0, 0],
			// dest:  [0, 0, 0],
			speed: 0,
			normal: [0, 0, 0]
		};
	}
	getMessage(id: string) {
		let user1;
		let user2;
		if (id == this._player.id)
		{
			user1 = this._player;
			user2 = this._opponent;
		}
		else
		{
			user2 = this._player;
			user1 = this._opponent;
		}
		return ({
			"id": user1.id,
			"pos": user1.pos,
			// "dest": user1.dest,
			// "speed": user1.speed,
			"opponentPos": user2.pos,
			// "opponentDest": user2.dest,
			// "opponentSpeed": user2.speed,
			"ballPos": this._ball.pos,
			// "ballDest": this._ball.dest,
			// "ballSpeed": this._ball.speed
		})
	}

	getNormaleVector(x: number, y: number): Tuple3<number>{
		const square = Math.pow(x, 2) + Math.pow(y, 2);
		return ([x/square, y/ square, 0]);
	}

	calculateDestOfBall(x: number, y: number) {
		// calculate destination of ball
		const y_direction = this._ball.normal[1] / Math.abs(this._ball.normal[1]);
		const x_direction = this._ball.normal[0] / Math.abs(this._ball.normal[0]);
		let y_collisionLen = (y_direction * y_wall_collision - y) / this._ball.normal[1];
		let x_collisionLen = (x_direction * x_collision - x) / this._ball.normal[0];
		const collisionLen = Math.min(y_collisionLen, x_collisionLen);
		// this._ball.dest = [
		// 	Math.round(x + collisionLen * this._ball.normal[0]),
		// 	Math.round(y + collisionLen * this._ball.normal[1]),
		// 	0
		// ];
		// if (y_collisionLen)

	}

	startBallMove() {
		let x = Math.random();
		let y = Math.random();
		this._ball.normal = this.getNormaleVector(x, y);
		this._ball.speed = 1;
	}
	checkLoseCondition() {
		let isLose = false;
		if (this._ball.pos[0] > x_lose_pos)
		{
			isLose = true;
			this._score[1]++;
		}
		if (this._ball.pos[0] < -x_lose_pos )
		{
			isLose = true;
			this._score[0]++;
		}
		return (isLose);
	}

	getBallCollision(){
		if (this.checkLoseCondition())
		{
			this.startBallMove();
			return ;
		}
		// if (this._ball.pos[1] > 0 && y_wall_collision - this._ball.pos[1] < 1)


	}
	calcBallDest(){
		// if ()
	}
}
