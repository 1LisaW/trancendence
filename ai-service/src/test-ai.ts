import { getAIMove } from './ai-logic';

const testCases = [
  // AI on right, ball moving toward AI, center Z
  {
    desc: 'AI right, ball moving toward AI, center Z',
    state: { pos: [45, 5, 0], ballPos: [0, 5, 0], ballSpeed: 1, ballNormal: [1, 0, 0] },
  },
  // AI on right, ball moving away from AI
  {
    desc: 'AI right, ball moving away from AI',
    state: { pos: [45, 5, 0], ballPos: [40, 5, 0], ballSpeed: 1, ballNormal: [-1, 0, 0] },
  },
  // AI on left, ball moving toward AI, Z positive
  {
    desc: 'AI left, ball moving toward AI, Z positive',
    state: { pos: [-45, 5, 10], ballPos: [0, 5, 0], ballSpeed: 1, ballNormal: [-1, 0, 0.5] },
  },
  // AI on left, ball moving away from AI
  {
    desc: 'AI left, ball moving away from AI',
    state: { pos: [-45, 5, 0], ballPos: [-40, 5, 0], ballSpeed: 1, ballNormal: [1, 0, 0] },
  },
  // Ball at top wall, moving toward AI
  {
    desc: 'Ball at top wall, moving toward AI',
    state: { pos: [45, 5, 34], ballPos: [0, 5, 35], ballSpeed: 1, ballNormal: [1, 0, -0.5] },
  },
  // Ball at bottom wall, moving toward AI
  {
    desc: 'Ball at bottom wall, moving toward AI',
    state: { pos: [45, 5, -34], ballPos: [0, 5, -35], ballSpeed: 1, ballNormal: [1, 0, 0.5] },
  },
  // Ball moving diagonally, high speed
  {
    desc: 'Ball moving diagonally, high speed',
    state: { pos: [45, 5, 0], ballPos: [0, 5, 20], ballSpeed: 2, ballNormal: [1, 0, -1] },
  },
  // Ball moving straight Z (should not move paddle)
  {
    desc: 'Ball moving straight Z (no X)',
    state: { pos: [45, 5, 0], ballPos: [45, 5, 10], ballSpeed: 1, ballNormal: [0, 0, 1] },
  },
  // Ball at paddle, should not move
  {
    desc: 'Ball at paddle, should not move',
    state: { pos: [45, 5, 0], ballPos: [45, 5, 0], ballSpeed: 1, ballNormal: [1, 0, 0] },
  },
  // Ball moving toward AI, Z far from paddle
  {
    desc: 'Ball moving toward AI, Z far from paddle',
    state: { pos: [45, 5, 30], ballPos: [0, 5, -30], ballSpeed: 1, ballNormal: [1, 0, 1] },
  },
  // Ball moving toward AI, Z close to paddle
  {
    desc: 'Ball moving toward AI, Z close to paddle',
    state: { pos: [45, 5, 0], ballPos: [0, 5, 2], ballSpeed: 1, ballNormal: [1, 0, -0.1] },
  },
  // Ball moving toward AI, very high speed
  {
    desc: 'Ball moving toward AI, very high speed',
    state: { pos: [45, 5, 0], ballPos: [0, 5, 0], ballSpeed: 3, ballNormal: [1, 0, 0.5] },
  },
];

testCases.forEach(({ desc, state }, i) => {
  const move = getAIMove(state as any);
  console.log(`Test ${i + 1}: ${desc}`);
  console.log('  State:', state);
  console.log('  AI move:', move);
}); 