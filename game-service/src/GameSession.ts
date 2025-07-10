import { nanoid } from "nanoid"
import { GameState, ScoreState, GameResult } from "./api";
type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };

type Tuple3<T> = Tuple<T, 3>;

interface SceneProps {
	"ground": {
		"name": string,
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
let sceneParams: SceneProps = require('../configuration.json');
// sceneParams = sceneParams as SceneProps;

interface PlayerProp {
	id: number | undefined;
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
console.log("sceneParams: ",sceneParams);
export type ModeProp = 'pvp' | 'pvc' | 'tournament';

const batZTopPos = (sceneParams.ground.height - sceneParams.bat.width) / 2;
const ballZTopPos = (sceneParams.ground.height - sceneParams.ball.diameter) / 2;
const ballXRightBatPos = sceneParams.opponent.startPosition[0] - (sceneParams.bat.depth + sceneParams.ball.diameter) / 2;
const ballXRightPos = (sceneParams.ground.width + sceneParams.ball.diameter) / 2;
const batZToEdge = sceneParams.bat.width / 2;

const batStep = sceneParams.bat.width / 2;
const frameStep = 1.5;

export class GameSession {
	private _id = nanoid();
	private _ids: number[] = [];
	private _players: Players;
	private _ball: BallProp;
	private _score = [0, 0];
	private _mode: ModeProp;

	private sendDataToUser;

	private terminated = false;
	private countdownActive = true; // simona added this
	private countdownTimer: NodeJS.Timeout | null = null; // simona added this

	constructor(mode: ModeProp, playerId: number, opponentId: number, sendDataToUser: (gameId: string, state: GameState | ScoreState | GameResult) => void) {
		this.sendDataToUser = sendDataToUser;
		this._mode = mode;
		this._players = {};
		
		if (mode === 'pvc') {
			// Simona - for PVC: AI should be first (left), Human should be second (right)
			this._ids.push(opponentId, playerId); // AI first, Human second
			
			// Human (playerId) gets RIGHT position, AI (opponentId) gets LEFT position
			this._players[playerId] = {
				id: playerId,
				pos: [...sceneParams.opponent.startPosition] as Tuple3<number>, // RIGHT: [45, 5, 0]
				dest: [...sceneParams.opponent.startPosition] as Tuple3<number>,
				speed: 0
			}
			this._players[opponentId] = {
				id: opponentId,
				pos: [...sceneParams.player.startPosition] as Tuple3<number>, // LEFT: [-45, 5, 0]
				dest: [...sceneParams.player.startPosition] as Tuple3<number>,
				speed: 0
			};
		} else {
			// Normal PVP mode
			this._ids.push(playerId, opponentId);
			
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
		}
		
		this._ball = {
			pos: [0, sceneParams.ball.diameter / 2, 0],
			speed: 0,
			normal: [0, 0, 0]
		};
		this.initBall();

		// Simona's addition -  Start countdown timer
		this.countdownTimer = setTimeout(() => {
			this.countdownActive = false;
			console.log(`Game ${this._id}: Countdown finished, game is now active`);
		}, 6000); // 6 seconds to match AI countdown
	}
	getId() {
		return this._id;
	}
	matchUserSocketId(socketId: string) {
		if (socketId in this._ids)
			return ([...this._ids]);
		return (null);
	}
	initBall() {
		this._ball.pos = [0, sceneParams.ball.diameter / 2, 0];
		// while (!this._ball.normal[0])
		this._ball.normal[0] = 0.5 + 0.5 * Math.random();
		this._ball.normal[2] = Math.sqrt(1 - Math.pow(this._ball.normal[0], 2));
		this._ball.speed = 1;
	}

	setBatMove(id: number, step: number) {
		// Simona's log 
		console.log(`🔧 setBatMove called: id=${id}, step=${step}`);
		const bat = this._players[id];
		
		// Simona added this as a safety check (might be removable tho)
		if (!bat) {
			console.log(`setBatMove: Player ${id} not found`);
			return;
		}

		// Simona's log 
		console.log(`🔧 Before move: bat.pos=${JSON.stringify(bat.pos)}, bat.dest=${JSON.stringify(bat.dest)}, bat.speed=${bat.speed}`);
		
		let z = bat.dest[2];
		
		if (step > 0) {
			this._players[id].dest[2] = Math.min(z + batStep, batZTopPos);
			this._players[id].speed = Math.min(this._players[id].speed + step, 3);
		}
		else {
			this._players[id].dest[2] = Math.max(z - batStep, -batZTopPos);
			this._players[id].speed = Math.max(this._players[id].speed + step, -3);
		}
		
		console.log(`🔧 After move: bat.pos=${JSON.stringify(this._players[id].pos)}, bat.dest=${JSON.stringify(this._players[id].dest)}, bat.speed=${this._players[id].speed}`);
	}

	private hasLoseRound(x: number, z: number, x_sign: number) {
		// Simona - added - Don't score during countdown (might be removable now -- to be checked)
		if (this.countdownActive) {
			return false;
		}
		
		if (x >= ballXRightPos) {
			this._score[0]++;
			this._ball.speed = 1;
			this.sendDataToUser(this._id, {players: this._ids, score: this._score});
			return (true)
		}
		if (x <= -ballXRightPos) {
			this._score[1]++;
			this._ball.speed = 1;
			this.sendDataToUser(this._id, {players: this._ids, score: this._score});
			return (true)
		}
		return false;
	}

	private hasWallCollision(x: number, z: number, z_sign: number) {
		if (z > ballZTopPos || z < -ballZTopPos) {
			const koef = (z_sign * ballZTopPos - z) / this._ball.normal[2];
			this._ball.pos[0] = x - koef * this._ball.normal[0];
			this._ball.pos[2] = ballZTopPos * z_sign;
			this._ball.speed = Math.min(this._ball.speed - 0.2, 1);
			this._ball.normal[2] *= -1;
			return true;
		}
		return false;
	}


	private hasBatCollision(x: number, z: number, x_sign: number) {
		if ((x >= ballXRightBatPos
			&& z >= this._players[this._ids[1]].pos[2] - batZToEdge
			&& z <= this._players[this._ids[1]].pos[2] + batZToEdge)
			|| (x <= -ballXRightBatPos
				&& z >= this._players[this._ids[0]].pos[2] - batZToEdge
				&& z <= this._players[this._ids[0]].pos[2] + batZToEdge)
		) {
			const koef = (x_sign * ballXRightBatPos - x) / this._ball.normal[0];
			this._ball.pos[0] = ballXRightBatPos * x_sign;
			this._ball.pos[2] = z - koef * this._ball.normal[2];
			this._ball.normal[0] *= -1;
			this._ball.speed = Math.min(this._ball.speed + 0.5, 3);
			return true;
		}
		return false;
	}
	updateBatState(id: number) {
		const bat = this._players[id]
		if (bat.pos[2] > bat.dest[2] && bat.speed > 0)
			bat.speed = -1;
		if (bat.pos[2] < bat.dest[2] && bat.speed < 0)
			bat.speed = 1;
		if (bat.speed === 0)
			return;
		if (bat.pos[2] == bat.dest[2]) {
			bat.speed = 0;
			return;
		}
		bat.pos[2] += bat.speed * frameStep;
		if (bat.speed > 0)
		bat.pos[2] = Math.min(bat.dest[2], bat.pos[2]);
		if (bat.speed < 0)
			bat.pos[2] = Math.max(bat.dest[2], bat.pos[2]);
		if (bat.pos[2] > batZTopPos)
			bat.pos[2] = batZTopPos;
		if (bat.pos[2] < -batZTopPos)
			bat.pos[2] = -batZTopPos;
	}
	updateBallState() {
		// Simona - Don't update ball position during countdown
		if (this.countdownActive) {
			return;
		}
		
		const step = this._ball.speed * frameStep;
		const z_sign = this._ball.normal[2] / Math.abs(this._ball.normal[2]);
		const x_sign = this._ball.normal[0] / Math.abs(this._ball.normal[0]);
		let x = this._ball.pos[0] + step * this._ball.normal[0];
		let z = this._ball.pos[2] + step * this._ball.normal[2];
		if (this.hasLoseRound(x, z, x_sign))
			this.initBall();
		else if (!this.hasWallCollision(x, z, z_sign) && !this.hasBatCollision(x, z, x_sign))
		{
		// if (!this.hasLoseRound(x, z, x_sign) && !this.hasBatCollision(x, z, x_sign) && !this.hasWallCollision(x, z, z_sign)) {
			this._ball.pos[0] = x;
			this._ball.pos[2] = z;
		}
		// else
			// this.initBall();

	}

	getState() {
		const player1Id = this._ids[0];
		const player2Id = this._ids[1];
		const player1 = this._players[player1Id];
		const player2 = this._players[player2Id];

		const res = {
			players: [player1Id, player2Id],
			pos: [player1.pos, player2.pos],
			ball: this._ball.pos
		}
		this.sendDataToUser(this._id, res);
		return (res);
	}

	updateState() {
		this._ids.forEach(id => this.updateBatState(id));
		this.updateBallState();
		this.getState();
		// return()
	}
	isFinished() {
		return (this._score[0] >= 5 || this._score[1] >= 5);
	}
	gameLoop() {
		console.log("*** GAME LOOP *** (game-service)");
		const tickLengthMs = 1000 / 20;
		let previousTick = Date.now();
		let actualTicks = 0;

		// const sessionPool = this.sessionPool;
		const gameLoop = () => {
			if (this.isFinished())
			{
				//const player1Result = this._score[0] < this._score[1] ? 'win' : 'lose'; // Simona commented this out to avoid error
				const player1Result = this._score[0] > this._score[1] ? 'win' : 'lose'; // Simona added this
				const player2Result = this._score[1] > this._score[0] ? 'win' : 'lose'; // Check player2's score
				this.sendDataToUser(this._id, {players: this._ids, gameResult:[player1Result, player2Result], score: this._score});
				return;
			}
			if (this.terminated)
				return;
			let now = Date.now()

			actualTicks++
			if (previousTick + tickLengthMs <= now) {
				const delta = (now - previousTick) / 1000
				previousTick = now;

				this.updateState();
				// this.getState();
				// session.updateState();
				//send response to backend

				// console.log('delta', delta, '(target: ' + tickLengthMs + ' ms)', 'node ticks', actualTicks)
				actualTicks = 0
			}

			if (Date.now() - previousTick < tickLengthMs - 16) {
				setTimeout(gameLoop)
			} else {
				setImmediate(gameLoop)
			}
		}
		gameLoop();
	}
	terminate() { // simona added this
		if (this.countdownTimer) {
			clearTimeout(this.countdownTimer);
			this.countdownTimer = null;
		}
		console.log("GAME SERVICE GAME TERMINATED ****");
		this.terminated = true;
	}
}
