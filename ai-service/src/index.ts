import Fastify from 'fastify';
import { AIManager } from './AI-manager';
import { BACKEND_WS_URL } from './api';
import { initializeAI } from './auth';

const fastify = Fastify({ logger: true });
const manager = AIManager.getInstance();

// FOR TATIANA  So far, we rely on an AI token (we can remove the bit below if you want a different authentication method)


// Initialize AI token on startup
let aiToken: string | null = null;

(async () => {
  try {
    aiToken = await initializeAI();
    console.log('AI authentication initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI authentication:', error);
  }
})();

// Create a new session for the AI to play in with a specific user ID
fastify.post('/session/new/:user_id', async (request, reply) => {
  const { user_id } = request.params as { user_id: number };
  if (user_id === undefined || user_id <= 0) {
    return reply.code(400).send({ error: 'Invalid user ID' });
  }
  manager.createUserAISession(user_id);
  return { status: 'session created', user_id: -user_id };

})

// Create a new session for the AI to play in
// fastify.post('/session', async (request, reply) => {
//   if (!aiToken) {
//     return reply.code(500).send({ error: 'AI not authenticated' });
//   }

//   const gameId = manager.createSession(BACKEND_WS_URL, aiToken);
//   return { gameId };
// });

// List all active sessions
fastify.get('/sessions', async (request, reply) => {
  return { sessions: manager.listSessions() };
});

// End a session when the game is over (closes its WebSocket)
fastify.delete('/session/:gameId', async (request, reply) => {
  const { gameId } = request.params as { gameId: string };
  manager.endSession(gameId);
  return { status: 'ended', gameId };
});

// Join a specific game (called by backend when PVC game is created)
// fastify.post('/join-game/:gameId', async (request, reply) => {
//   if (!aiToken) {
//     return reply.code(500).send({ error: 'AI not authenticated' });
//   }

//   const { gameId } = request.params as { gameId: string };
//   const sessionId = manager.createSessionForGame(gameId, BACKEND_WS_URL, aiToken);
//   return { status: 'joined', gameId: sessionId };
// });

// Start the Fastify server
fastify.listen({ port: 8086, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`AI-service listening at ${address}`);
});
