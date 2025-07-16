// AI-session.ts - includes countdown system (so not to play in countdown) and game loop

import WebSocket from 'ws';
import { getAIMove } from './ai-logic';
import { AIEnvironment } from './AI-environment';
import { AIManager } from './AI-manager'; // Added import for AIManager

enum AIState {
  WAITING = 'waiting',           // Waiting for first game state
  COUNTDOWN = 'countdown',       // 6-second countdown - ignore everything
  PLAYING = 'playing',           // Active gameplay
  FINISHED = 'finished'          // Game over
}

export class AISession {
  private ws: WebSocket;
  public gameId: string = '';
  private state: any = null;
  private previousState: any = null;
  private gameLoop: ReturnType<typeof setInterval> | null = null;
  private order: number | undefined;
  private lastValidPosition: [number, number, number] | null = null;
  private aiEnvironment: AIEnvironment;
  private isFinished: boolean = false;
  private _state = AIState.WAITING;
  private opponent = '';

  // Countdown logic
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;
  private firstGameStateReceived = false;

  // Countdown protection flag
  private countdownActive = false;

  constructor(user_id: number) {
    // this.gameId = gameId;
    this.ws = new WebSocket('http://backend:8082/game', (-user_id).toString());
    this._state = AIState.WAITING;

    // this.aiEnvironment = new AIEnvironment(gameId, this.ws);

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      } catch (e) {
        console.error(`[${this.gameId}] Message parse error:`, e);
      }
    });

    this.ws.on('close', () => {
      console.log(`[${this.gameId}] AI WebSocket closed - cleaning up`);
      this.cleanup();
    });
    this.ws.on('error', (err) => {
      console.error(`[${this.gameId}] WebSocket error:`, err);
    });

    // this.ws.on('open', () => {
    //   console.log(`[${this.gameId}] AI connected - sending gameId to backend`);
    //   // Send gameId immediately after connection
    //   this.ws.send(JSON.stringify({ gameId: this.gameId }));
    // });
  }

  public handleMessage(msg: any) {
    // Handle game end immediately
    if (msg.gameResult || (msg.message && this.isGameEndMessage(msg.message))) {
      this.onGameEnd();
      return;
    }

    // Handle game setup
    if (msg.gameId && msg.order !== undefined) {
      this.onGameSetup(msg);
      return;
    }

    // Handle game state updates
    if (msg.players && (msg.pos || msg.ball)) {
      this.onGameStateUpdate(msg);
      return;
    }
  }

  private onGameSetup(msg: any) {
    this.gameId = msg.gameId;
    this.aiEnvironment = new AIEnvironment(this.gameId, this.ws);
    this.order = msg.order;
    this.opponent = msg.opponent || 'Human';

    console.log(`[${this.gameId}] Game setup - AI is player ${this.order}, opponent: ${this.opponent}`);

    // Reset everything for new game
    this.resetForNewGame();
  }

  private onGameStateUpdate(msg: any) {
    // For debugging
    //if (this.countdownActive) {
    //  console.log(`[${this.gameId}] 🚫 COUNTDOWN ACTIVE - Ignoring game state`);
    //  return;
    //}

    // Start countdown on first game state
    if (!this.firstGameStateReceived && this._state === AIState.WAITING) {
      this.startCountdown();
      this.firstGameStateReceived = true;
      return; // We don't process this state
    }

    // Only process when actively playing
    if (this._state !== AIState.PLAYING || this.isFinished) {
      return;
    }

    // Store states for AI processing
    this.previousState = this.state;
    this.state = msg;
    // Auto-detect order if not set
    if (this.order === undefined && msg.players) {
      const aiIndex = msg.players.findIndex((p: number) => p === -1);
      this.order = aiIndex;
      console.log(`[${this.gameId}] Auto-detected AI order: ${this.order}`);
    }
  }

  private startCountdown() {
    console.log(`[${this.gameId}] 🕐 COUNTDOWN STARTED - AI locked for 6 seconds`);
    this._state = AIState.COUNTDOWN;
    this.countdownActive = true; // Set protection flag

    // Clear any existing timers
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
    }
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    // Start 6-second countdown
    this.countdownTimer = setTimeout(() => {
      this.finishCountdown();
    }, 6000);
  }

  private finishCountdown() {
    if (this.isFinished) return;

    console.log(`[${this.gameId}] ✅ COUNTDOWN FINISHED - AI now active!`);
    this._state = AIState.PLAYING;
    this.countdownActive = false; // Remove protection flag

    // Start the game loop
    this.startGameLoop();
  }

  private startGameLoop() {
    // Clear any existing game loop
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    console.log(`[${this.gameId}] 🎮 Starting AI game loop`);

    // AI loop with protection
    this.gameLoop = setInterval(() => {
      // For Debugging
      // if (this.countdownActive) {
      //  console.log(`[${this.gameId}] 🚫 Game loop blocked - countdown active`);
      //  return;
      //}

      if (this._state !== AIState.PLAYING) {
        return;
      }

      if (this.isFinished || !this.state || this.order === undefined) {
        return;
      }

      // For Debugging
      //console.log(`[${this.gameId}] AI update triggered (1-second interval as per subject requirement)`);

      try {
        const aiState = this.transformGameState(this.state, this.order);

        // Get scene parameters from environment
        const sceneParams = this.aiEnvironment.getSceneParams();

        const move = getAIMove(aiState, sceneParams);

        if (move !== 'none') {
          console.log(`[${this.gameId}] 🤖 AI move: ${move}`);
          this.aiEnvironment.sendAIMove(move);
        }
      } catch (error) {
        console.error(`[${this.gameId}] AI game loop error:`, error);
      }
    }, 1000);
  }

  private onGameEnd() {
    if (this.isFinished) return;
    console.log(`[${this.gameId}] 🏁 Game ended - AI session closing`);
    this.isFinished = true;
    this._state = AIState.FINISHED;
    this.countdownActive = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
      console.log(`[${this.gameId}] Game loop explicitly stopped on game end`);
    }
    this.cleanup();
  }

  private resetForNewGame() {
    console.log(`[${this.gameId}] 🔄 Reset for new game`);
    // Reset all state
    this.state = null;
    this.previousState = null;
    this.lastValidPosition = null;
    this.isFinished = false;
    this._state = AIState.WAITING;
    this.firstGameStateReceived = false;
    this.countdownActive = false; // Reset protection flag
    // Clear all timers
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  private isGameEndMessage(message: string): boolean {
    return message.includes('leave the room') ||
           message.includes('LOSE') ||
           message.includes('left the room') ||
           message.includes('terminated') ||
           message.includes('disconnected') ||
           (message.includes('Player') && message.includes('left'));
  }

  private cleanup() {
        // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }
    if (this.isFinished) return;

    console.log(`[${this.gameId}] 🧹 AI Session cleaning up`);
    this.isFinished = true;
    this._state = AIState.FINISHED;
    this.countdownActive = false;
    // Clear all timers
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    // // Close WebSocket
    // if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    //   this.ws.close();
    // }
  }

  private transformGameState(gameState: any, aiOrder: number): {
    pos: [number, number, number],
    ballPos: [number, number, number],
    ballSpeed: number,
    ballNormal: [number, number, number]
  } {
    // Log the full game state for debugging to see if score is included
    console.log(`[${this.gameId}] Full game state:`, JSON.stringify(gameState, null, 2));

    // Validate game state structure
    if (!gameState || !gameState.pos || !Array.isArray(gameState.pos) || gameState.pos.length < 2) {
      return this.getDefaultState();
    }

    if (this.order === undefined) {
      return this.getDefaultState();
    }

    const aiPaddlePos = gameState.pos[this.order];
    const ballPos = gameState.ball || [0, 1, 0];

    // Handle null positions
    let validAIPaddlePos: [number, number, number];
    if (!aiPaddlePos || aiPaddlePos.length < 3 || aiPaddlePos[2] === null) {
      if (this.lastValidPosition) {
        validAIPaddlePos = [...this.lastValidPosition];
      } else {
        validAIPaddlePos = this.order === 0 ? [-45, 5, 0] : [45, 5, 0];
      }
    } else {
      validAIPaddlePos = [
        aiPaddlePos[0] !== null ? aiPaddlePos[0] : (this.order === 0 ? -45 : 45),
        aiPaddlePos[1] !== null ? aiPaddlePos[1] : 5,
        aiPaddlePos[2] !== null ? aiPaddlePos[2] : 0
      ];
      this.lastValidPosition = [...validAIPaddlePos];
    }
// <<<<<<< HEAD

    // ✅ USE ACTUAL BALL SPEED AND NORMAL FROM GAME STATE
    let ballSpeed = 1;
    let ballNormal: [number, number, number] = [1, 0, 0];

    // Check if game state includes ballSpeed and ballNormal
    if (gameState.ballSpeed !== undefined && gameState.ballNormal !== undefined) {
      ballSpeed = gameState.ballSpeed;
      ballNormal = gameState.ballNormal;
      // Ensure ballNormal is properly formatted as [x, y, z]
      if (Array.isArray(ballNormal) && ballNormal.length >= 3) {
        ballNormal = [ballNormal[0], ballNormal[1] || 0, ballNormal[2]];
      } else {
        // Fallback to calculated direction if normal is invalid
        ballNormal = this.calculateBallDirection(ballPos);
      }
    } else {
      // Fallback to old calculation method if new fields are not available
      ballNormal = this.calculateBallDirection(ballPos);
      ballSpeed = this.calculateBallSpeed(ballPos);
    }
    return {
      pos: validAIPaddlePos,
      ballPos: ballPos,
      ballSpeed: ballSpeed,
      ballNormal: ballNormal
    };
  }

  // ✅ ADD HELPER METHODS FOR FALLBACK CALCULATIONS
  private calculateBallDirection(ballPos: [number, number, number]): [number, number, number] {
// =======

//     // Calculate ball direction and speed
//     let ballDirection: [number, number, number] = [1, 0, 0];
//     let ballSpeed = 1;

// >>>>>>> origin/dev
    if (this.previousState && this.previousState.ball && ballPos) {
      const prevBall = this.previousState.ball;
      const dx = ballPos[0] - prevBall[0];
      const dy = ballPos[1] - prevBall[1];
      const dz = ballPos[2] - prevBall[2];
// <<<<<<< HEAD

      const speed = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (speed > 0.01) {
        return [dx/speed, dy/speed, dz/speed];
      }
    }
    return [1, 0, 0]; // Default direction
  }

  private calculateBallSpeed(ballPos: [number, number, number]): number {
    if (this.previousState && this.previousState.ball && ballPos) {
      const prevBall = this.previousState.ball;
      const dx = ballPos[0] - prevBall[0];
      const dy = ballPos[1] - prevBall[1];
      const dz = ballPos[2] - prevBall[2];

      return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    return 1; // Default speed
// =======

//       ballSpeed = Math.sqrt(dx*dx + dy*dy + dz*dz);

//       if (ballSpeed > 0.01) {
//         ballDirection = [dx/ballSpeed, dy/ballSpeed, dz/ballSpeed];
//       } else {
//         ballSpeed = 1;
//       }
//     }

//     // Score data is no longer used by AI logic

//     return {
//       pos: validAIPaddlePos,
//       ballPos: ballPos,
//       ballSpeed: ballSpeed,
//       ballNormal: ballDirection
//     };
// >>>>>>> origin/dev
  }

  private getDefaultState(): {
    pos: [number, number, number],
    ballPos: [number, number, number],
    ballSpeed: number,
    ballNormal: [number, number, number]
  } {
    return {
      pos: this.order === 0 ? [-45, 5, 0] : [45, 5, 0],
      ballPos: [0, 1, 0],
      ballSpeed: 1,
      ballNormal: this.order === 0 ? [1, 0, 0] : [-1, 0, 0]
    };
  }

  close() {
    this.cleanup();
  }

  // Add a static method to handle message routing
  static handleMessageForGame(gameId: string, msg: any): boolean {
    // This will be called by the manager to route messages to the correct session
    const session = AIManager.getInstance().getSession(gameId);
    if (session) {
      session.handleMessage(msg);
      return true;
    }
    return false;
  }
}
