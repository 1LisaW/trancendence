import { nanoid } from "nanoid"
import { GameState, ScoreState, GameResult } from "./api";
import { SCORE_GAME_PERSONAL_RESULT } from "./model";
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

interface PlayerProp {
	id: number | undefined;
	pos: Tuple3<number>,
	dest: Tuple3<number>,
	speed: number
}
type Players = Record<string, PlayerProp>

interface BallProp {
	pos: Tuple3<number>,
	speed: number,
	normal: Tuple3<number>,
}
console.log("sceneParams: ",sceneParams);
export type ModeProp = 'pvp' | 'pvc' | 'tournament';

const batZTopPos = (sceneParams.ground.height - sceneParams.bat.width) / 2;
const ballZTopPos = (sceneParams.ground.height - sceneParams.ball.diameter) / 2;
const ballXRightBatPos = sceneParams.opponent.startPosition[0] - (sceneParams.bat.depth + sceneParams.ball.diameter) / 2;
const ballXLeftBatPos = sceneParams.player.startPosition[0] + (sceneParams.bat.depth + sceneParams.ball.diameter) / 2;
const ballXRightPos = (sceneParams.ground.width + sceneParams.ball.diameter) / 2;
const ballXLeftPos = -(sceneParams.ground.width + sceneParams.ball.diameter) / 2;
const batZToEdge = sceneParams.bat.width / 2;

const batStep = sceneParams.bat.width / 2;
const frameStep = 1.5;

export enum MatchOptions {
	START,
	FORFEIT,
	TECHNICAL_WIN,
	WIN,
	LOSE,
	DRAW
}

export class GameSession {
	private _id = nanoid();
	private _ids: number[] = [];
	private _players: Players;
	private _ball: BallProp;
	private _score = [0, 0];
	private _mode: ModeProp;

	private sendDataToUser;

	private terminated = false;
	private countdownActive = true;
	private countdownTimer: NodeJS.Timeout | null = null;

	constructor(mode: ModeProp, playerId: number, opponentId: number, sendDataToUser: (gameId: string, state: GameState | ScoreState | GameResult) => void) {
		this.sendDataToUser = sendDataToUser;
		this._mode = mode;
		this._players = {};

		if (mode === 'pvc') {
			// For PVC: AI should be first (left), Human should be second (right)
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

		// Start countdown timer
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
// <<<<<<< HEAD

// 		// Randomize ball direction: 50% chance to go left or right
// =======

// 		// while (!this._ball.normal[0])
// 		//this._ball.normal[0] = 0.5 + 0.5 * Math.random(); // Simona commented this out

// 		// Simona - Randomize ball direction: 50% chance to go left or right
// >>>>>>> origin/dev
		const directionX = Math.random() < 0.5 ? -1 : 1;
		this._ball.normal[0] = directionX * (0.5 + 0.5 * Math.random());

		// Randomize Z direction (up/down)
		const directionZ = Math.random() < 0.5 ? -1 : 1;
		this._ball.normal[2] = directionZ * Math.sqrt(1 - Math.pow(this._ball.normal[0], 2));
		this._ball.normal[1] = 0; // Ensure Y component is 0
		this._ball.speed = 1;

		//console.log(`🏓 Ball initialized: pos=${JSON.stringify(this._ball.pos)}, normal=${JSON.stringify(this._ball.normal)}, speed=${this._ball.speed}`);
	}

	setBatMove(id: number, step: number) {
// <<<<<<< HEAD
// 		//console.log(`🔧 setBatMove called: id=${id}, step=${step}`);
// 		const bat = this._players[id];

// =======
		// Simona's log
		console.log(`🔧 setBatMove called: id=${id}, step=${step}`);
		const bat = this._players[id];

		// Simona added this as a safety check (might be removable tho)
// >>>>>>> origin/dev
		if (!bat) {
			console.log(`setBatMove: Player ${id} not found`);
			return;
		}

// <<<<<<< HEAD
// 		//console.log(`🔧 Before move: bat.pos=${JSON.stringify(bat.pos)}, bat.dest=${JSON.stringify(bat.dest)}, bat.speed=${bat.speed}`);

// =======
// 		// Simona's log
// 		console.log(`🔧 Before move: bat.pos=${JSON.stringify(bat.pos)}, bat.dest=${JSON.stringify(bat.dest)}, bat.speed=${bat.speed}`);

// >>>>>>> origin/dev
		let z = bat.dest[2];

		if (step > 0) {
			this._players[id].dest[2] = Math.min(z + batStep, batZTopPos);
			this._players[id].speed = Math.min(this._players[id].speed + step, 3);
		}
		else {
			this._players[id].dest[2] = Math.max(z - batStep, -batZTopPos);
			this._players[id].speed = Math.max(this._players[id].speed + step, -3);
		}
// <<<<<<< HEAD

// 		//console.log(`🔧 After move: bat.pos=${JSON.stringify(this._players[id].pos)}, bat.dest=${JSON.stringify(this._players[id].dest)}, bat.speed=${this._players[id].speed}`);
// =======

// 		console.log(`🔧 After move: bat.pos=${JSON.stringify(this._players[id].pos)}, bat.dest=${JSON.stringify(this._players[id].dest)}, bat.speed=${this._players[id].speed}`);
// >>>>>>> origin/dev
	}

	private hasLoseRound(x: number, z: number): boolean {
		// Don't score during countdown
		if (this.countdownActive) {
			return false;
		}
// <<<<<<< HEAD

// 		// Check if ball went past right boundary (left player scores)
// =======

// >>>>>>> origin/dev
		if (x >= ballXRightPos) {
			console.log(`🎯 Right boundary crossed! Ball at x=${x}, boundary=${ballXRightPos}`);
			this._score[0]++;
			this._ball.speed = 1;
			this.sendDataToUser(this._id, {players: this._ids, score: this._score});
			return true;
		}

		// Check if ball went past left boundary (right player scores)
		if (x <= ballXLeftPos) {
			console.log(`🎯 Left boundary crossed! Ball at x=${x}, boundary=${ballXLeftPos}`);
			this._score[1]++;
			this._ball.speed = 1;
			this.sendDataToUser(this._id, {players: this._ids, score: this._score});
			return true;
		}

		return false;
	}

	private hasWallCollision(x: number, z: number): boolean {
		const ballRadius = sceneParams.ball.diameter / 2;

		// Check collision with top or bottom wall
		if (z + ballRadius >= ballZTopPos || z - ballRadius <= -ballZTopPos) {
			//console.log(`🧱 Wall collision detected! Ball z=${z}, ballRadius=${ballRadius}, boundary=${ballZTopPos}`);

			// Calculate collision point and reflect
			const targetZ = z + ballRadius >= ballZTopPos ? ballZTopPos - ballRadius : -ballZTopPos + ballRadius;

			// Set ball position at the wall boundary
			this._ball.pos[0] = x;
			this._ball.pos[2] = targetZ;

			// Reflect the Z component of the normal vector
			this._ball.normal[2] *= -1;

			// Reduce speed slightly on wall collision
			this._ball.speed = Math.max(this._ball.speed - 0.1, 0.5);

			//console.log(`🧱 After wall collision: pos=${JSON.stringify(this._ball.pos)}, normal=${JSON.stringify(this._ball.normal)}`);
			return true;
		}

		return false;
	}

	private hasBatCollision(x: number, z: number): boolean {
		const ballRadius = sceneParams.ball.diameter / 2;

		// Check collision with right bat (opponent)
		if (x + ballRadius >= ballXRightBatPos && this._ball.normal[0] > 0) {
			const rightBatZ = this._players[this._ids[1]].pos[2];
			if (z >= rightBatZ - batZToEdge && z <= rightBatZ + batZToEdge) {
				//console.log(`🏓 Right bat collision! Ball x=${x}, bat boundary=${ballXRightBatPos}, bat z=${rightBatZ}`);

				// Position ball at bat boundary
				this._ball.pos[0] = ballXRightBatPos - ballRadius;
				this._ball.pos[2] = z;

				// Reflect X component and add slight randomness
				this._ball.normal[0] = -Math.abs(this._ball.normal[0]);

				// Add slight variation based on where ball hits bat
				const hitOffset = (z - rightBatZ) / batZToEdge; // -1 to 1
				this._ball.normal[2] += hitOffset * 0.3;

				// Normalize the normal vector
				const normalMagnitude = Math.sqrt(this._ball.normal[0] ** 2 + this._ball.normal[2] ** 2);
				this._ball.normal[0] /= normalMagnitude;
				this._ball.normal[2] /= normalMagnitude;

				// Increase speed slightly
				this._ball.speed = Math.min(this._ball.speed + 0.3, 3);

				//console.log(`🏓 After right bat collision: pos=${JSON.stringify(this._ball.pos)}, normal=${JSON.stringify(this._ball.normal)}`);
				return true;
			}
		}

		// Check collision with left bat (player)
		if (x - ballRadius <= ballXLeftBatPos && this._ball.normal[0] < 0) {
			const leftBatZ = this._players[this._ids[0]].pos[2];
			if (z >= leftBatZ - batZToEdge && z <= leftBatZ + batZToEdge) {
				//console.log(`🏓 Left bat collision! Ball x=${x}, bat boundary=${ballXLeftBatPos}, bat z=${leftBatZ}`);

				// Position ball at bat boundary
				this._ball.pos[0] = ballXLeftBatPos + ballRadius;
				this._ball.pos[2] = z;

				// Reflect X component and add slight randomness
				this._ball.normal[0] = Math.abs(this._ball.normal[0]);

				// Add slight variation based on where ball hits bat
				const hitOffset = (z - leftBatZ) / batZToEdge; // -1 to 1
				this._ball.normal[2] += hitOffset * 0.3;

				// Normalize the normal vector
				const normalMagnitude = Math.sqrt(this._ball.normal[0] ** 2 + this._ball.normal[2] ** 2);
				this._ball.normal[0] /= normalMagnitude;
				this._ball.normal[2] /= normalMagnitude;

				// Increase speed slightly
				this._ball.speed = Math.min(this._ball.speed + 0.3, 3);

				//console.log(`🏓 After left bat collision: pos=${JSON.stringify(this._ball.pos)}, normal=${JSON.stringify(this._ball.normal)}`);
				return true;
			}
		}

		return false;
	}

	updateBatState(id: number) {
		const bat = this._players[id];

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
		// Don't update ball position during countdown
		if (this.countdownActive) {
			return;
		}

		const step = this._ball.speed * frameStep;

		// Calculate next position
		const nextX = this._ball.pos[0] + step * this._ball.normal[0];
		const nextZ = this._ball.pos[2] + step * this._ball.normal[2];

		//console.log(`🎾 Ball update: current pos=${JSON.stringify(this._ball.pos)}, next pos=[${nextX}, ${this._ball.pos[1]}, ${nextZ}], normal=${JSON.stringify(this._ball.normal)}, speed=${this._ball.speed}`);

		// Check for scoring FIRST - this is critical!
		if (this.hasLoseRound(nextX, nextZ)) {
			console.log(`🎯 Goal scored! Reinitializing ball`);
			this.initBall();
			return;
		}

		// Check for wall collision
		if (this.hasWallCollision(nextX, nextZ)) {
			// Ball position and normal are already updated in hasWallCollision
			return;
		}

		// Check for bat collision LAST
		if (this.hasBatCollision(nextX, nextZ)) {
			// Ball position and normal are already updated in hasBatCollision
			return;
		}

		// No collision, update ball position normally
		this._ball.pos[0] = nextX;
		this._ball.pos[2] = nextZ;

		//console.log(`🎾 Ball moved to: ${JSON.stringify(this._ball.pos)}`);
	}

	getState() {
		const player1Id = this._ids[0];
		const player2Id = this._ids[1];
		const player1 = this._players[player1Id];
		const player2 = this._players[player2Id];

		const res = {
			players: [player1Id, player2Id],
			pos: [player1.pos, player2.pos],
			ball: this._ball.pos,
			ballSpeed: this._ball.speed,  // ✅ Added this
			ballNormal: this._ball.normal  // ✅ Added this too
		}
		this.sendDataToUser(this._id, res);
		return res;
	}

	updateState() {
		this._ids.forEach(id => this.updateBatState(id));
		this.updateBallState();
		this.getState();
	}

	isFinished() {
		return (this._score[0] >= 5 || this._score[1] >= 5);
	}

// <<<<<<< HEAD
// =======
	getGameResult(userId = 0): GameResult {
		const win = userId ? SCORE_GAME_PERSONAL_RESULT.TECHNICAL_WIN: SCORE_GAME_PERSONAL_RESULT.WIN;
		const lose = userId ? SCORE_GAME_PERSONAL_RESULT.FORFEIT: SCORE_GAME_PERSONAL_RESULT.LOSE;

		const player1Result = this._score[0] < this._score[1] ? win : lose;
		const player2Result = this._score[0] > this._score[1] ? win : lose;
		const gameResult: GameResult = {
			players: this._ids,
			gameResult:[player1Result, player2Result],
			score: this._score,
			mode: this._mode
		};
		return gameResult;
	}
// >>>>>>> origin/dev
	gameLoop() {
		console.log("*** GAME LOOP *** (game-service)");
		const tickLengthMs = 1000 / 20;
		let previousTick = Date.now();
		let actualTicks = 0;

		const gameLoop = () => {
// <<<<<<< HEAD
// 			if (this.isFinished()) {
// 				const player1Result = this._score[0] > this._score[1] ? 'win' : 'lose';
// 				const player2Result = this._score[1] > this._score[0] ? 'win' : 'lose';
// 				this.sendDataToUser(this._id, {players: this._ids, gameResult:[player1Result, player2Result], score: this._score});
// =======
			if (this.isFinished())
			{
// <<<<<<< HEAD
// 				//const player1Result = this._score[0] < this._score[1] ? 'win' : 'lose'; // Simona commented this out to avoid error
// 				const player1Result = this._score[0] > this._score[1] ? 'win' : 'lose'; // Simona added this
// 				const player2Result = this._score[1] > this._score[0] ? 'win' : 'lose'; // Check player2's score
// 				this.sendDataToUser(this._id, {players: this._ids, gameResult:[player1Result, player2Result], score: this._score});
// =======
				const gameResult = this.getGameResult();
				//const player1Result = this._score[0] < this._score[1] ? 'win' : 'lose';
				//const player2Result = this._score[0] > this._score[1] ? 'win' : 'lose';
				this.sendDataToUser(this._id, gameResult);
// >>>>>>> origin/dev
// >>>>>>> origin/dev
				return;
			}
			if (this.terminated)
				return;

			let now = Date.now();
			actualTicks++;

			if (previousTick + tickLengthMs <= now) {
				previousTick = now;
				this.updateState();
				actualTicks = 0;
			}

			if (Date.now() - previousTick < tickLengthMs - 16) {
				setTimeout(gameLoop);
			} else {
				setImmediate(gameLoop);
			}
		}
		gameLoop();
	}
// <<<<<<< HEAD

// 	terminate() {
// =======
// <<<<<<< HEAD
// 	terminate() { // simona added this
// 		if (this.countdownTimer) {
// 			clearTimeout(this.countdownTimer);
// 			this.countdownTimer = null;
// 		}
// =======
	terminate(userId = 0) {
// >>>>>>> origin/dev
		console.log("GAME SERVICE GAME TERMINATED ****");
		// simona added this
// >>>>>>> origin/dev
		if (this.countdownTimer) {
			clearTimeout(this.countdownTimer);
			this.countdownTimer = null;
		}
		this.terminated = true;
		if (this._mode === 'tournament')
		{
			const gameResult = this.getGameResult(userId);
			this.sendDataToUser(this._id, gameResult);
		}
	}
}
