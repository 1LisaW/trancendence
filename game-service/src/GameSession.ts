import { nanoid } from "nanoid"
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
let sceneParams:SceneProps = require('../configuration.json');
// sceneParams = sceneParams as SceneProps;

interface PlayerProp {
	id: string | undefined;
	pos: Tuple3<number>,
	dest: Tuple3<number>,
	speed: number
}
type Players = Record<string, PlayerProp>

interface BallProp {
	pos: Tuple3<number>,
	// dest: Tuple3<number>,
	speed: number,
	normal: Tuple3<number>,
}

export type ModeProp = 'pvp' | 'pvc';

const batYTopPos = (sceneParams.ground.height - sceneParams.bat.width) / 2;
const ballYTopPos = (sceneParams.ground.height - sceneParams.ball.diameter) / 2;
const ballXRightBatPos = sceneParams.opponent.startPosition[0]  - ( sceneParams.bat.depth + sceneParams.ball.diameter) / 2;
const ballXRightPos = (sceneParams.ground.height + sceneParams.ball.diameter) / 2;
const batYToEdge = sceneParams.bat.height / 2;

const batStep =  sceneParams.bat.width / 2;
const frameStep = 0.01;

export class GameSession{
	private _id = nanoid();
	private _ids: string[] = [];
	private _players: Players;
	private _ball: BallProp;
	private _score = [0,0];
	private _mode: ModeProp;
	constructor(mode: ModeProp, playerId: string, opponentId: string ){
		this._mode = mode;
		this._ids.push(playerId, opponentId);
		this._players = {};
		this._players[playerId] = {
			id: playerId,
			pos: [...sceneParams.player.startPosition] as Tuple3<number>,
			dest: [...sceneParams.player.startPosition] as Tuple3<number>,
			speed: 0
		}
		this._players[opponentId] = {
			id: opponentId,
			pos: [...sceneParams.opponent.startPosition] as Tuple3<number>,
			dest: [...sceneParams.opponent.startPosition] as Tuple3<number>,
			speed: 0
		};
		this._ball = {
			pos: [0, 0, 0],
			speed: 0,
			normal: [0, 0, 0]
		};
		this.initBall();
	}
	getId(){
		return this._id;
	}
	initBall(){
		while (!this._ball.normal[0])
			this._ball.normal[0] = Math.random();
		this._ball.normal[1] = Math.sqrt(1 - Math.pow(this._ball.normal[0], 2));
		this._ball.speed = 1;
	}

	setBatMove(id: string, step: number){
		console.log("Before: Bat of user ", id, " updated it's position: ", this._players[id].dest[1],", speed: ", this._players[id].speed);
		let y = this._players[id].dest[1];
		if (step > 0)
			y = Math.min(y + batStep, batYTopPos);
		else
			y = Math.max(y - batStep, -batYTopPos);

		this._players[id].dest[1] = y;
		this._players[id].speed += step;
		console.log("After: Bat of user ", id, " updated it's position: ", this._players[id].dest[1],", speed: ", this._players[id].speed);
	}

	private hasLoseRound(x: number, y: number, x_sign: number){
		if (x >= ballXRightPos)
		{
			this._score[1]++;
			return(true)
		}
		if (x <= -ballXRightPos)
		{
			this._score[0]++;
			return(true)
		}
		return false;
	}

	private hasWallCollision(x: number, y: number, y_sign: number){
		if (y > ballYTopPos || y < -ballYTopPos)
		{
			const koef = (y_sign * ballYTopPos - y) / this._ball.normal[1];
			this._ball.pos[0] = x - koef * this._ball.normal[0];
			this._ball.pos[1] = ballYTopPos * y_sign;
			this._ball.normal[1] *= -1;
			return true;
		}
		return false;
	}


	private hasBatCollision(x: number, y: number, x_sign: number){
		if ((x >= ballXRightBatPos
			&& y >= this._players[this._ids[0]].pos[1] - batYToEdge
			&& y <= this._players[this._ids[0]].pos[1] + batYToEdge)
		|| (y <= -ballXRightBatPos
			&& y >= this._players[this._ids[1]].pos[1] - batYToEdge
			&& y <= this._players[this._ids[1]].pos[1] + batYToEdge)
		)
		{
			const koef = (x_sign * ballXRightBatPos - x) / this._ball.normal[0];
			this._ball.pos[0] = ballXRightBatPos * koef;
			this._ball.pos[1] = y - koef * this._ball.normal[1];
			this._ball.normal[0] *= -1;
			return true;
		}
		return false;
	}
	updateBatState(id:string){
		const bat = this._players[id]
		if (bat.speed === 0)
			return ;
		if (bat.pos[1] == bat.dest[1])
		{
			bat.speed = 0;
			return;
		}
		bat.pos[1] += bat.speed * frameStep;
		if (bat.pos[1] > batYTopPos)
			bat.pos[1] = batYTopPos;
		if (bat.pos[1] < -batYTopPos)
			bat.pos[1] = -batYTopPos;
	}
	updateBallState(){
		const step = this._ball.speed * frameStep;
		const y_sign = this._ball.normal[1] / Math.abs(this._ball.normal[1]);
		const x_sign = this._ball.normal[0] / Math.abs(this._ball.normal[0]);
		let x = this._ball.pos[0] + step * this._ball.normal[0];
		let y = this._ball.pos[1] + step * this._ball.normal[1];
		if (!this.hasLoseRound(x, y,x_sign) && !this.hasBatCollision(x, y, x_sign) && !this.hasWallCollision(x, y, y_sign))
		{
			this._ball.pos[0] = x;
			this._ball.pos[1] = y;
		}
		else
			this.initBall();

	}

	getState(){
		const player1Id = this._ids[0];
		const player2Id = this._ids[2];
		const player1 = this._players[player1Id];
		const player2 = this._players[player2Id];
		const res = {
			[player1Id]: {
				pos: player1.pos
			},
			[player2Id]: {
				pos: player2.pos
			},
			ball: this._ball.pos
		}
		return (res);
	}

	updateState(){
		this._ids.forEach(id => this.updateBatState(id));
		this.updateBallState();
		console.log(this.getState());
		// return()
	}
	isFinished(){
		return(this._score[0] >= 15 || this._score[1] >= 15);
	}
}
