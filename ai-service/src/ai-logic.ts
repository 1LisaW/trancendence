// AI Logic for ft_transcendence Pong 3D 


interface GameState {
  pos: [number, number, number];
  ballPos: [number, number, number];
  ballSpeed: number;
  ballNormal: [number, number, number];
}

interface SceneParameters {
  ground: { width: number, height: number };
  bat: { width: number, height: number, depth: number };
  ball: { diameter: number };
}

export function getAIMove(state: GameState, sceneParams?: SceneParameters): 'up' | 'down' | 'none' {
  const scene = initializeSceneParams(sceneParams);
  
  if (!validateGameState(state)) {
    return 'none';
  }

  const { pos, ballPos, ballSpeed, ballNormal } = state;
  const paddleX = pos[0];
  const paddleZ = pos[2]; // This is 1-second-old data!
  const ballX = ballPos[0];
  const ballZ = ballPos[2];
  
  console.log(`AI DEBUG: Paddle=[${paddleX.toFixed(1)}, ${paddleZ.toFixed(1)}] (1s old), Ball=[${ballX.toFixed(1)}, ${ballZ.toFixed(1)}], Speed=${ballSpeed.toFixed(2)}`);
  
  // Calculate dynamic boundaries from scene parameters
  const batZTopPos = (scene.ground.height - scene.bat.width) / 2;
  const maxPaddleZ = batZTopPos - 2; // Safety margin
  const minPaddleZ = -batZTopPos + 2; // Safety margin
  
  // CRITICAL: Handle boundary situations more intelligently
  // If paddle is near boundaries, be more conservative
  if (paddleZ >= maxPaddleZ) {
    console.log(`AI: Near top boundary (${paddleZ}) - only allow DOWN moves`);
    if (ballZ < paddleZ - 5) {
      return 'up'; // Move toward ball if it's significantly below
    }
    return 'none'; // Stay put if ball is not far enough
  }
  
  if (paddleZ <= minPaddleZ) {
    console.log(`AI: Near bottom boundary (${paddleZ}) - only allow UP moves`);
    if (ballZ > paddleZ + 5) {
      return 'down'; // Move toward ball if it's significantly above
    }
    return 'none'; // Stay put if ball is not far enough
  }
  
  // Normal AI logic for non-boundary cases
  const aiIsRight = paddleX > 0;
  const ballMovingTowardAI = (aiIsRight && ballNormal[0] > 0) || (!aiIsRight && ballNormal[0] < 0);
  
  console.log(`AI: Ball direction analysis - AI at X=${paddleX.toFixed(1)} (isRight=${aiIsRight}), Ball normal X=${ballNormal[0].toFixed(3)}, Moving toward AI=${ballMovingTowardAI}`);
  
  let targetZ = ballZ; // ALWAYS target the ball, never center

  if (ballMovingTowardAI) {
    console.log(`AI: Ball approaching - AGGRESSIVE DEFENSE`);
    // Use prediction if available, otherwise current ball position
    const prediction = predictBallPosition(ballPos, ballNormal, ballSpeed, paddleX, scene);
    if (prediction.success && prediction.timeToReach < 12) { // Increased from 8 to 12
      targetZ = prediction.predictedZ;
      console.log(`AI: SMART PREDICTION - targeting Z=${targetZ.toFixed(2)} (${prediction.bounces} bounces)`);
    } else {
      // Better fallback - predict 1-2 seconds ahead instead of using current position
      const futureTime = Math.min(2.0, Math.abs((paddleX - ballX) / (ballNormal[0] * ballSpeed)) || 1.0);
      targetZ = ballZ + ballNormal[2] * ballSpeed * futureTime;
      
      // Clamp to field boundaries
      const fieldMaxZ = (scene.ground.height - scene.ball.diameter) / 2;
      const fieldMinZ = -(scene.ground.height - scene.ball.diameter) / 2;
      targetZ = Math.max(fieldMinZ, Math.min(fieldMaxZ, targetZ));
      
      console.log(`AI: SIMPLE PREDICTION - targeting Z=${targetZ.toFixed(2)} (${futureTime.toFixed(1)}s ahead)`);
    }
  } else {
    console.log(`AI: Ball moving away - STRATEGIC FOLLOW`);
    // Better strategic positioning when ball is moving away
    if (Math.abs(ballZ) < 10) {
      // Ball near center - move toward center for better coverage
      targetZ = ballZ * 0.5;
    } else {
      // Ball far from center - follow more aggressively
      targetZ = ballZ * 0.8;
    }
    console.log(`AI: Strategic follow - targeting Z=${targetZ.toFixed(2)}`);
  }

  const difference = targetZ - paddleZ;
  console.log(`AI: Current=${paddleZ.toFixed(2)}, Target=${targetZ.toFixed(2)}, Diff=${difference.toFixed(2)}`);

  // Difficulty adjustment settings (make AI more beatable)
  const DIFFICULTY_SETTINGS = {
    MOVEMENT_THRESHOLD: 2.0,      // Increase to 3.0 for easier gameplay
    DEADBAND_SIZE: 1.5,           // Increase to 2.5 for more hesitation  
    PREDICTION_TIME_LIMIT: 12,    // Reduce to 8 for worse predictions
    STRATEGIC_FOLLOW_RATIO: 0.8,  // Reduce to 0.6 for worse positioning
    UPDATE_INTERVAL: 300          // Increase to 400-500ms for slower reactions
  };

  // ✅ FIXED: More aggressive movement thresholds for better scoring
  if (difference > DIFFICULTY_SETTINGS.MOVEMENT_THRESHOLD && paddleZ < maxPaddleZ - 1) {
    console.log(`AI: Moving DOWN (aggressive pursuit)`);
    return 'down';
  }

  if (difference < -DIFFICULTY_SETTINGS.MOVEMENT_THRESHOLD && paddleZ > minPaddleZ + 1) {
    console.log(`AI: Moving UP (aggressive pursuit)`);
    return 'up';
  }

  // Smaller deadband for more responsive movement  
  if (Math.abs(difference) <= DIFFICULTY_SETTINGS.DEADBAND_SIZE) {
    console.log(`AI: Close enough to target`);
    return 'none';
  }

  console.log(`AI: Staying put (optimal position)`);
  return 'none';
}

function predictBallPosition(
  ballPos: [number, number, number], 
  ballNormal: [number, number, number], 
  ballSpeed: number, 
  targetX: number, 
  scene: SceneParameters
): { success: boolean; predictedZ: number; timeToReach: number; bounces: number } {
  const ballX = ballPos[0];
  const ballZ = ballPos[2];
  const ballVelocityX = ballNormal[0] * ballSpeed;
  const ballVelocityZ = ballNormal[2] * ballSpeed;
  
  console.log(`AI: PREDICTION INPUT - Ball=[${ballX.toFixed(1)}, ${ballZ.toFixed(1)}], Normal=[${ballNormal[0].toFixed(3)}, ${ballNormal[2].toFixed(3)}], Speed=${ballSpeed.toFixed(2)}`);
  
  // Velocity check - if X velocity is too small, ball isn't heading toward AI
  if (Math.abs(ballVelocityX) < 0.05) { // Increased from 0.01 to 0.05 for more realistic threshold
    console.log(`AI: Ball moving too slowly in X direction (vX=${ballVelocityX.toFixed(3)}) - use strategic follow`);
    return { success: false, predictedZ: ballZ, timeToReach: 999, bounces: 0 };
  }
  
  // Check if ball is moving toward AI's side
  const aiIsRight = targetX > 0;
  const ballMovingTowardAI = (aiIsRight && ballVelocityX > 0) || (!aiIsRight && ballVelocityX < 0);
  
  if (!ballMovingTowardAI) {
    console.log(`AI: Ball moving away from AI side (aiRight=${aiIsRight}, ballVelX=${ballVelocityX.toFixed(3)}) - use follow mode`);
    return { success: false, predictedZ: ballZ, timeToReach: 999, bounces: 0 };
  }
  
  const distanceX = Math.abs(ballX - targetX);
  const timeToReach = distanceX / Math.abs(ballVelocityX);
  
  console.log(`AI: PREDICTION CALC - Distance=${distanceX.toFixed(1)}, VelX=${ballVelocityX.toFixed(3)}, Time=${timeToReach.toFixed(1)}s`);
  
  // Realistic time limits for competitive play
  if (timeToReach > 15) { // Increased from 5 to 15 seconds
    console.log(`AI: Prediction too far in future (${timeToReach.toFixed(1)}s) - use fallback`);
    return { success: false, predictedZ: ballZ, timeToReach, bounces: 0 };
  }
  
  // Physics prediction with proper wall bouncing
  let currentZ = ballZ;
  let currentVelZ = ballVelocityZ;
  let remainingTime = timeToReach;
  let bounces = 0;
  
  // Field boundaries from scene parameters
  const fieldMaxZ = (scene.ground.height - scene.ball.diameter) / 2;
  const fieldMinZ = -(scene.ground.height - scene.ball.diameter) / 2;
  
  // Simulate wall bounces for more accurate prediction
  while (remainingTime > 0 && bounces < 2) { // Max 2 bounces for realism
    if (Math.abs(currentVelZ) < 0.001) {
      // Ball not moving in Z, just use current position
      break;
    }
    
    const timeToWall = currentVelZ > 0 
      ? (fieldMaxZ - currentZ) / currentVelZ 
      : (fieldMinZ - currentZ) / currentVelZ;
    
    if (timeToWall > 0 && timeToWall <= remainingTime) {
      // Ball hits wall during prediction time
      currentZ = currentVelZ > 0 ? fieldMaxZ : fieldMinZ;
      currentVelZ *= -0.95; // Slight energy loss on bounce
      remainingTime -= timeToWall;
      bounces++;
      console.log(`AI: Bounce ${bounces} at Z=${currentZ.toFixed(1)}, remaining time=${remainingTime.toFixed(1)}s`);
    } else {
      // Ball reaches AI before hitting wall
      currentZ += currentVelZ * remainingTime;
      remainingTime = 0;
    }
  }
  
  // Final position at AI's X coordinate
  let predictedZ = currentZ;
  
  // Clamp to reachable paddle area
  const batZTopPos = (scene.ground.height - scene.bat.width) / 2;
  const maxReach = batZTopPos - 2;
  const minReach = -batZTopPos + 2;
  
  predictedZ = Math.max(minReach, Math.min(maxReach, predictedZ));
  
  console.log(`AI: PREDICTION SUCCESS - time=${timeToReach.toFixed(1)}s, Z=${predictedZ.toFixed(2)}, bounces=${bounces}`);
  
  return { 
    success: true, 
    predictedZ, 
    timeToReach, 
    bounces 
  };
}

function initializeSceneParams(sceneParams?: SceneParameters): SceneParameters {
  // Fallback that matches GameSession defaults
  return sceneParams || {
    ground: { width: 100, height: 70 },
    bat: { width: 15, height: 10, depth: 4 },
    ball: { diameter: 2 }
  };
}

function validateGameState(state: GameState): boolean {
  return state && state.pos && state.ballPos && state.ballSpeed > 0;
}