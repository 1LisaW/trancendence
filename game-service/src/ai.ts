import { GameState } from './api';

// Hardcode configuration.json values
const config = require('../configuration.json');

const batZTopPos = (config.ground.height - config.bat.width) / 2; // 27.5
const ballZTopPos = (config.ground.height - config.ball.diameter) / 2; // 34
const ballXRightBatPos = config.opponent.startPosition[0] - (config.bat.depth + config.ball.diameter) / 2; // 42
const batStep = config.bat.width / 2; // 7.5
const frameStep = 1.5; // Game physics
const FRAMES_PER_AI_UPDATE = 20; // 1 second at 20 FPS
const MOVES = [-1, 0, 1]; // Matches setBatMove steps

interface AIGameState {
  ball: { pos: [number, number, number]; speed: number; normal: [number, number, number] };
  player: { pos: [number, number, number] };
  ai: { pos: [number, number, number] };
  ground: { width: number; height: number };
  bat: { width: number; depth: number };
  ballDiameter: number;
}

// Predict ball's z-position at AI's paddle
function predictBallTrajectory(state: AIGameState, maxFrames: number): number {
  let { pos: [x, y, z], normal: [nx, ny, nz], speed } = state.ball;
  const aiPaddleX = ballXRightBatPos; // 42

  for (let i = 0; i < maxFrames; i++) {
    const step = speed * frameStep;
    x += step * nx;
    z += step * nz;
    const zSign = nz === 0 ? 1 : nz / Math.abs(nz);

    // Wall collision
    if (z > ballZTopPos || z < -ballZTopPos) {
      const koef = nz === 0 ? 0 : (zSign * ballZTopPos - z) / nz;
      x -= koef * nx;
      z = zSign * ballZTopPos;
      nz *= -1;
    }

    // Reached AI's paddle
    if (x + state.ballDiameter >= aiPaddleX) {
      const koef = nx === 0 ? 0 : (aiPaddleX - (x + state.ballDiameter)) / nx;
      const targetZ = z + koef * nz;
      console.log(`Predicted z: ${targetZ}, x: ${x}, z: ${z}, nx: ${nx}, nz: ${nz}`); // Debug
      return targetZ;
    }
  }

  // Fallback to current z
  console.log(`Prediction failed, using current z: ${z}`); // Debug
  return z;
}

// Evaluate a move
function evaluate(state: AIGameState, targetZ: number, move: number): number {
  const aiCenter = state.ai.pos[2] + move * batStep; // Single step movement
  let score = 0;

  // If ball is moving away, stay put
  if (state.ball.pos[0] < 0) {
    if (move === 0) score += 1000;
    console.log(`Ball moving away, Move: ${move}, Score: ${score}`); // Debug
    return score;
  }

  // Align with target z
  const distance = Math.abs(aiCenter - targetZ);
  score -= distance * 1000;
  if (targetZ > aiCenter) score += move * 1000; // Strongly favor moving down
  if (targetZ < aiCenter) score -= move * 1000; // Strongly favor moving up

  console.log(`Move: ${move}, Score: ${score}, aiCenter: ${aiCenter}, targetZ: ${targetZ}`); // Debug
  return score;
}

// Compute AI move
export function getAIMove(state: GameState, aiId: number): number {
  const aiState: AIGameState = {
    ball: {
      pos: state.ball as [number, number, number],
      speed: 1.0, // Default speed from GameSession.ts
      normal: [
        state.ball[0] >= 0 ? 0.7 : -0.7, // Assume moving toward AI when x >= 0
        0,
        state.ball[2] >= 0 ? 0.7 : -0.7 // Adjust nz based on z direction
      ]
    },
    player: { pos: state.pos[0] as [number, number, number] },
    ai: { pos: state.pos[1] as [number, number, number] },
    ground: { width: config.ground.width, height: config.ground.height },
    bat: { width: config.bat.width, depth: config.bat.depth },
    ballDiameter: config.ball.diameter
  };

  // If ball is near AI, use current z
  let targetZ: number;
  if (state.ball[0] >= 40) {
    targetZ = state.ball[2];
    console.log(`Ball near AI, using current z: ${targetZ}`); // Debug
  } else {
    targetZ = predictBallTrajectory(aiState, FRAMES_PER_AI_UPDATE * 2); // Look ahead 2 seconds
  }

  let bestMove = 0;
  let bestScore = -Infinity;

  for (const move of MOVES) {
    const newZ = aiState.ai.pos[2] + move * batStep; // Single step movement
    if (newZ < -batZTopPos || newZ > batZTopPos) continue; // Stay within bounds (-27.5, 27.5)

    const score = evaluate(aiState, targetZ, move);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  console.log(`Best move: ${bestMove}, Best score: ${bestScore}`); // Debug
  return bestMove;
}