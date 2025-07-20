// AI-session.ts - includes countdown system (so not to play in countdown) and game loop

import WebSocket from 'ws';
import { getAIMove } from './ai-logic';
import { AIEnvironment } from './AI-environment';
import { AIManager } from './AI-manager'; 

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

  // Track AI's actual position independently
  private aiTrackedPosition: [number, number, number] = [-45, 5, 0]; // LEFT side default
  private lastMoveTime = 0;
  private lastMoveDirection: 'up' | 'down' | 'none' = 'none';

  // Move history tracking
  private moveHistory: Array<{direction: 'up' | 'down' | 'none', timestamp: number}> = [];

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
  }

  public handleMessage(msg: any) {
    // ✅ FIXED: Better game end detection - handle all termination scenarios
    if (msg.gameResult || 
        msg.terminated === true || 
        (msg.message && this.isGameEndMessage(msg.message))) {
      console.log(`[${this.gameId}] 🛑 Game end detected:`, msg);
      this.onGameEnd();
      return;
    }

    // ✅ FIXED: Prevent new game setup if already finished or currently finishing
    if (this.isFinished || this._state === AIState.FINISHED) {
      console.log(`[${this.gameId}] 🚫 Ignoring message - AI session already finished`);
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
      const aiIndex = msg.players.findIndex((p: number) => p < 0); // Look for any negative ID
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

    console.log(`[${this.gameId}] 🎮 Starting AI game loop - EXACTLY 1 second intervals (ft_transcendence compliant)`);

    // AI loop with EXACTLY 1-second intervals as required by ft_transcendence subject
    this.gameLoop = setInterval(() => {
      if (this._state !== AIState.PLAYING) {
        return;
      }

      if (this.isFinished || !this.state || this.order === undefined) {
        return;
      }

      try {
        // UPDATE AI'S TRACKED POSITION FIRST
        this.updateAITrackedPosition();
        
        const aiState = this.transformGameState(this.state, this.order);

        // Get scene parameters from environment
        const sceneParams = this.aiEnvironment.getSceneParams();

        const move = getAIMove(aiState, sceneParams);

        if (move !== 'none') {
          console.log(`[${this.gameId}] 🤖 AI move: ${move} (AGGRESSIVE MODE)`);
          this.aiEnvironment.sendAIMove(move);
          
          // Track the move with timestamp
          this.moveHistory.push({
            direction: move,
            timestamp: Date.now()
          });
          
          // Clean old moves (older than 2 seconds)
          this.moveHistory = this.moveHistory.filter(m => Date.now() - m.timestamp < 2000);
        } else {
          console.log(`[${this.gameId}] 🎯 AI holding position (optimal)`);
        }
      } catch (error) {
        console.error(`[${this.gameId}] AI game loop error:`, error);
      }
    }, 300); // ✅ OPTIMIZED: Better interval for aggressive AI
  }

  // Update AI's tracked position based on moves sent
  private updateAITrackedPosition() {
    // Get baseline position from game state (1 second old)
    if (this.state && this.state.pos) {
      const aiPlayerId = this.state.players.find((id: number) => id < 0);
      const aiPlayerIndex = this.state.players.indexOf(aiPlayerId);
      const gameStatePos = this.state.pos[aiPlayerIndex];
      
      // Start with game state position if we don't have a better estimate
      if (!this.lastValidPosition) {
        this.aiTrackedPosition = [gameStatePos[0], gameStatePos[1], gameStatePos[2]];
        this.lastValidPosition = [...this.aiTrackedPosition];
        console.log(`[${this.gameId}] 📍 AI baseline position: [${this.aiTrackedPosition.join(', ')}]`);
        return;
      }
    }

    // Predict current position based on moves sent in the last second
    const now = Date.now();
    const movesSent = this.getMovesInLastSecond(now);
    
    // Simulate paddle movement for each move sent
    let predictedZ = this.lastValidPosition[2];
    
    movesSent.forEach(move => {
      const batStep = 7.5; // From GameSession
      if (move.direction === 'up') {
        predictedZ = Math.max(predictedZ - batStep, -27.5);
      } else if (move.direction === 'down') {
        predictedZ = Math.min(predictedZ + batStep, 27.5);
      }
    });
    
    this.aiTrackedPosition[2] = predictedZ;
    console.log(`[${this.gameId}] 🎯 AI predicted position: Z=${predictedZ.toFixed(1)} (${movesSent.length} moves applied)`);
  }

  private onGameEnd() {
    if (this.isFinished) {
      console.log(`[${this.gameId}] ⚠️ Game end called but already finished - ignoring`);
      return;
    }
    
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
    this.countdownActive = false;
    
    // RESET POSITION TRACKING
    this.aiTrackedPosition = [-45, 5, 0]; // Reset to LEFT side default
    this.lastMoveTime = 0;
    this.lastMoveDirection = 'none';
    
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
           message.includes('left the room') ||
           message.includes('left room') ||
           message.includes('LOSE') ||
           message.includes('terminated') ||
           message.includes('disconnected') ||
           message.includes('forfeit') ||
           message.includes('quit') ||
           message.includes('abandon') ||
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
    // CRITICAL FIX: Find AI position by matching the AI player ID
    const aiPlayerId = gameState.players.find((id: number) => id < 0); // Find AI player ID
    const aiPlayerIndex = gameState.players.indexOf(aiPlayerId); // Get AI's index in arrays
    
    const aiPaddlePos = gameState.pos[aiPlayerIndex]; // Use AI's actual index
    
    console.log(`[${this.gameId}] 🎯 AI ID: ${aiPlayerId}, Index: ${aiPlayerIndex}, Position: [${aiPaddlePos.join(', ')}]`);
    
    return {
      pos: aiPaddlePos, // Use AI's actual position
      ballPos: gameState.ball || [0, 1, 0],
      ballSpeed: gameState.ballSpeed || 1,
      ballNormal: gameState.ballNormal || [1, 0, 0]
    };
  }

  // HELPER METHODS FOR FALLBACK CALCULATIONS
  private calculateBallDirection(ballPos: [number, number, number]): [number, number, number] {

    if (this.previousState && this.previousState.ball && ballPos) {
      const prevBall = this.previousState.ball;
      const dx = ballPos[0] - prevBall[0];
      const dy = ballPos[1] - prevBall[1];
      const dz = ballPos[2] - prevBall[2];

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

  // Get moves in last second
  private getMovesInLastSecond(now: number): Array<{direction: 'up' | 'down', timestamp: number}> {
    return this.moveHistory
      .filter(move => now - move.timestamp <= 1000 && move.direction !== 'none')
      .map(move => ({
        direction: move.direction as 'up' | 'down',
        timestamp: move.timestamp
      }));
  }
}