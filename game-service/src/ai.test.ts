import { getAIMove } from './ai';
import { GameState } from './api';

// Mock configuration.json values
const config = {
  ground: { width: 100, height: 70 },
  bat: { width: 15, depth: 4 },
  ball: { diameter: 2 },
  player: { startPosition: [-45, 5, 0] },
  opponent: { startPosition: [45, 5, 0] }
};

// Test cases
const tests: { name: string; state: GameState; aiId: number; expectedMove: number }[] = [
  {
    name: 'Ball moving toward AI, below center',
    state: {
      players: [1, 0],
      pos: [[-45, 5, 0], [45, 5, 0]], // Player at z=0, AI at z=0
      ball: [0, 1, 10] // Ball at z=10, moving toward AI
    },
    aiId: 0,
    expectedMove: 1 // Move down to align with z=10
  },
  {
    name: 'Ball near top wall',
    state: {
      players: [1, 0],
      pos: [[-45, 5, 0], [45, 5, 0]],
      ball: [40, 1, 33] // Near top wall (z=34)
    },
    aiId: 0,
    expectedMove: 1 // Move toward top (z=27.5)
  },
  {
    name: 'Ball moving away after player hit',
    state: {
      players: [1, 0],
      pos: [[-45, 5, 0], [45, 5, 0]],
      ball: [-40, 1, 0] // Moving toward player
    },
    aiId: 0,
    expectedMove: 0 // Stay put
  },
  {
    name: 'Ball near AI paddle, above center',
    state: {
      players: [1, 0],
      pos: [[-45, 5, 0], [45, 5, 0]],
      ball: [40, 1, -10] // Ball at z=-10, near AI
    },
    aiId: 0,
    expectedMove: -1 // Move up to align with z=-10
  }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  console.log(`Running test: ${test.name}`);
  const move = getAIMove(test.state, test.aiId);
  console.log(`Expected move: ${test.expectedMove}, Got: ${move}`);
  if (move === test.expectedMove) {
    console.log('Test passed!\n');
    passed++;
  } else {
    console.log('Test failed!\n');
    failed++;
  }
});

console.log(`Test Summary: ${passed} passed, ${failed} failed`);