// This file contains an AI logic for Pong 3D 
// For the team: the player can be tweaked to more or less strong as we wish -- feel free to ask me to change the parameters (feedback is welcome!)

export function getAIMove(state: {
  pos: [number, number, number],
  ballPos: [number, number, number],
  ballSpeed: number,
  ballNormal: [number, number, number]
}, sceneParams?: {
  ground: { width: number, height: number },
  bat: { width: number, height: number, depth: number },
  ball: { diameter: number }
}): 'up' | 'down' | 'none' {
  // Use provided scene params or fallback to defaults
  const FIELD_WIDTH = sceneParams?.ground.width || 100;
  const FIELD_HEIGHT = sceneParams?.ground.height || 70;
  const BAT_WIDTH = sceneParams?.bat.width || 15;
  const BALL_DIAMETER = sceneParams?.ball.diameter || 2;
  
  const BAT_STEP = BAT_WIDTH / 2;
  const FRAME_STEP = 1.5;
  const FIELD_Z = FIELD_HEIGHT / 2;

  const paddleX = state.pos[0];
  const paddleZ = state.pos[2];
  const ballX = state.ballPos[0];
  const ballZ = state.ballPos[2];
  const speed = state.ballSpeed;
  const normal = state.ballNormal;

  console.log(`AI DEBUG: paddle=[${paddleX.toFixed(1)},${paddleZ.toFixed(1)}], ball=[${ballX.toFixed(1)},${ballZ.toFixed(1)}], speed=${speed.toFixed(2)}, normal=[${normal[0].toFixed(3)},${normal[2].toFixed(3)}]`);

  // Validate inputs
  if (paddleX === null || paddleX === undefined || ballX === null || ballX === undefined) {
    console.log(`AI: Null coordinates detected, returning 'none'`);
    return 'none';
  }

  if (speed <= 0) {
    console.log(`AI: Invalid speed (${speed}), returning 'none'`);
    return 'none';
  }

  // Check if ball is moving toward the AI
  const aiIsRight = paddleX > 0;
  const ballMovingTowardAI = (aiIsRight && normal[0] > 0) || (!aiIsRight && normal[0] < 0);
  
  if (!ballMovingTowardAI) {
    console.log(`AI: Ball moving away (aiIsRight=${aiIsRight}, normalX=${normal[0].toFixed(3)}), calculating strategic position`);
    // Move toward a predicted return point instead of just center
    const opponentSide = aiIsRight ? -FIELD_Z : FIELD_Z;
    const timeToOpponent = Math.abs(opponentSide - ballX) / Math.abs(normal[0] * speed * FRAME_STEP);
    let returnZ = ballZ + normal[2] * speed * FRAME_STEP * timeToOpponent;
    let returnBounces = 0;
    while ((returnZ > FIELD_Z || returnZ < -FIELD_Z) && returnBounces < 10) {
      if (returnZ > FIELD_Z) returnZ = 2 * FIELD_Z - returnZ;
      if (returnZ < -FIELD_Z) returnZ = -2 * FIELD_Z - returnZ;
      returnBounces++;
    }
    console.log(`AI: Strategic return point Z: ${returnZ.toFixed(2)} (bounces: ${returnBounces})`);
    if (paddleZ > returnZ + BAT_STEP / 2) return 'up';
    if (paddleZ < returnZ - BAT_STEP / 2) return 'down';
    return 'none';
  }

  // Calculate time for ball to reach AI paddle's X
  const dx = Math.abs(paddleX - ballX);
  const vx = Math.abs(normal[0] * speed * FRAME_STEP);
  
  if (vx < 0.001) { // Very small for floating point comparison
    console.log(`AI: Ball horizontal velocity too small (${vx.toFixed(4)})`);
    return 'none';
  }
  
  const timeToReach = dx / vx;
  console.log(`AI: Time to reach paddle: ${timeToReach.toFixed(2)} steps (dx=${dx.toFixed(2)}, vx=${vx.toFixed(3)})`);

  // Predict Z position at that time
  const vz = normal[2] * speed * FRAME_STEP;
  let predictedZ = ballZ + vz * timeToReach;

  // Simulate wall bounces
  let bounces = 0;
  while ((predictedZ > FIELD_Z || predictedZ < -FIELD_Z) && bounces < 10) { // Prevent infinite loop
    if (predictedZ > FIELD_Z) predictedZ = 2 * FIELD_Z - predictedZ;
    if (predictedZ < -FIELD_Z) predictedZ = -2 * FIELD_Z - predictedZ;
    bounces++;
  }

  // Add small error for realism (increased range for more human-like imperfection)
  const error = (Math.random() - 0.5) * 5;
  predictedZ += error;

  console.log(`AI: Predicted ball Z: ${predictedZ.toFixed(2)}, paddle Z: ${paddleZ.toFixed(2)} (bounces: ${bounces})`);

  // Set a fixed inaction chance regardless of score
  let inactionChance = dx > 30 ? 0.15 : 0.05;
  console.log(`AI: Fixed inaction chance set to ${inactionChance}`);
  
  if (Math.random() < inactionChance) {
    console.log(`AI: Random inaction for balance (chance: ${inactionChance})`);
    return 'none';
  }

  // Add reaction delay when ball is very close (simulate human reaction time, increased frequency)
  if (Math.abs(ballX - paddleX) < 5 && Math.random() < (0.2 + speed * 0.05)) { 
    console.log(`AI: Delayed reaction due to ball proximity and speed (dx=${Math.abs(ballX - paddleX).toFixed(2)}, speed=${speed.toFixed(2)})`);
    return 'none';
  }

  // Move paddle toward predicted position with dynamic threshold based on ball speed
  const threshold = BAT_STEP / 8 + (speed * 0.02); // Adjustable for smoother reactions
  console.log(`AI: Distance to predicted Z: ${Math.abs(predictedZ - paddleZ).toFixed(2)}, Threshold: ${threshold.toFixed(2)}`);
  console.log(`AI: Dynamic threshold set to ${threshold.toFixed(2)} based on speed ${speed.toFixed(2)}`);

  // If paddle Z is exactly 0 and ball is approaching, be more aggressive
  if (paddleZ === 0 && Math.abs(ballX - paddleX) < 20) {
    console.log(`AI: Paddle at suspicious position Z=0, using ball position for guidance`);
    if (Math.abs(ballZ) > 1) {
      return ballZ > 0 ? 'down' : 'up';
    }
  }

  // Force movement check 
  if (Math.abs(ballX - paddleX) < 10 && paddleZ === 0 && Math.abs(ballZ) > 2) {
    console.log(`AI: Forcing movement - ball at Z=${ballZ.toFixed(1)}, paddle stuck at Z=0`);
    return ballZ > 0 ? 'down' : 'up';
  }

  // Calculate proportional movement for smoothness
  const zDifference = predictedZ - paddleZ;
  const proportionalStep = zDifference * 0.95; // Move 95% of the distance to predicted Z
  console.log(`AI: Proportional step calculated: ${proportionalStep.toFixed(2)} (95% of difference ${zDifference.toFixed(2)})`);

  // Adjust threshold based on distance as well to avoid over-correction
  const adjustedThreshold = Math.min(threshold, Math.abs(zDifference) * 0.4);
  console.log(`AI: Adjusted threshold for over-correction: ${adjustedThreshold.toFixed(2)} based on distance`);

  // Decide movement based on proportional step if outside adjusted threshold
  if (Math.abs(proportionalStep) > adjustedThreshold) {
    if (proportionalStep < 0) {
      console.log(`AI: Moving UP with proportional step (step: ${proportionalStep.toFixed(2)} < threshold: ${adjustedThreshold.toFixed(2)})`);
      return 'up';
    } else {
      console.log(`AI: Moving DOWN with proportional step (step: ${proportionalStep.toFixed(2)} > threshold: ${adjustedThreshold.toFixed(2)})`);
      return 'down';
    }
  }

  console.log(`AI: Staying in position (proportional step: ${Math.abs(proportionalStep).toFixed(2)} within threshold: ${adjustedThreshold.toFixed(2)})`);
  return 'none';
}