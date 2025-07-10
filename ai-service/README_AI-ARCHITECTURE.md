# AI Service Architecture - ft_transcendence Pong

## Overview

This document explains the AI service architecture for the ft_transcendence Pong project. The AI service is a microservice that provides intelligent opponents for Player vs Computer (PVC) games, running as a separate service that connects to the backend via WebSocket.

## Architecture Overview

### Multi-Session AI System
The AI service supports **multiple concurrent game sessions**, each with its own WebSocket connection and AI session. This allows multiple players to play against the AI simultaneously without interference.

The backend uses a Map-based approach to track multiple AI WebSocket connections.

Key Features:

- One AI socket per game: Each game gets its own dedicated AI WebSocket connection
- GameId-based routing: Messages are routed to the correct AI session using the gameId
- Automatic cleanup: When games end, the corresponding AI socket is removed from the map

Session Isolation
- In the ai-service, each game gets its own AISession instance. (See AIManager class for this.)

Message Routing
- The manager routes incoming messages to the correct session based on gameId.

Auto-clean-up
- Sessiosn are automatically cleaned after 5 mins of when the games end.


### Key Components 

1. **AIManager** (`src/AI-manager.ts`)
   - Singleton class that manages all AI sessions
   - Routes messages to the correct session based on `gameId`
   - Handles session creation, cleanup, and lifecycle management

2. **AISession** (`src/AI-session.ts`)
   - Individual AI session for each game
   - Manages WebSocket connection to backend
   - Handles game state processing and AI decision making
   - Implements countdown system to prevent AI from playing during game countdown

3. **AIEnvironment** (`src/AI-environment.ts`)
   - Handles communication with the backend
   - Sends AI moves via WebSocket
   - Manages game-specific configuration

4. **AI Logic** (`src/ai-logic.ts`)
   - Core AI algorithm for paddle movement decisions
   - Physics-based ball trajectory prediction
   - Human-like imperfections and strategic positioning

## How It Works

### 1. Connection Flow

```
Player starts PVC game → Backend creates game → Backend calls AI service → AI creates session → AI connects to backend
```

1. **Player initiates PVC game**: Frontend sends matchmaking request with `mode: "pvc"`
2. **Backend creates game**: Backend creates game session and assigns gameId
3. **Backend calls AI service**: Backend makes HTTP request to `ai-service:8086/join-game/{gameId}`
4. **AI creates session**: AIManager creates new AISession for the specific gameId
5. **AI connects to backend**: AISession establishes WebSocket connection with special token `AI_SERVICE_TOKEN`
6. **AI sends gameId**: AI immediately sends `{gameId: gameId}` to identify which game this connection is for

### 2. Message Routing

The backend tracks AI WebSocket connections using a Map:

```typescript
const aiSockets: Map<string, WSocket> = new Map(); // gameId -> WebSocket
```

- **Connection**: When AI connects, backend waits for first message containing `gameId`, then stores the socket
- **Message forwarding**: Game state updates are sent to the correct AI socket based on `gameId`
- **Cleanup**: When AI disconnects, backend removes the socket from the Map

### 3. Game State Processing

```
Backend receives game state → Sends to AI → AI processes state → AI makes decision → AI sends move → Backend forwards to game service
```

1. **Game service** sends game state to backend via HTTP
2. **Backend** forwards state to human players and AI (if PVC game)
3. **AI session** receives state and processes it through AI logic
4. **AI makes decision** based on ball trajectory prediction
5. **AI sends move** via WebSocket to backend
6. **Backend forwards** AI move to game service as if it were a human player

### 4. AI Decision Making

The AI algorithm operates on a 1-second interval and follows this process:

1. **Input Validation**: Checks for valid game state data
2. **Direction Analysis**: Determines if ball is moving toward or away from AI
3. **Trajectory Prediction**: 
   - If ball moving toward AI: Predicts where ball will cross AI's side
   - If ball moving away: Calculates strategic return position
4. **Human-like Imperfections**: Adds prediction errors, random inaction, reaction delays
5. **Movement Decision**: Compares predicted position with current paddle position
6. **Output**: Returns 'up', 'down', or 'none' movement command


## Example of Logs

The logs sample below shows the system working correctly with multiple concurrent sessions:

```
ai-service           | [Go2I6xSnUrrvh1TAdhPwT] 🤖 AI move: down
ai-service           | [C5KPbZsw5wd9cOV1MCE7p] 🏁 Game ended - AI session closing
ai-service           | Session C5KPbZsw5wd9cOV1MCE7p ended and removed. Remaining sessions: 1
ai-service           | Session Go2I6xSnUrrvh1TAdhPwT ended and removed. Remaining sessions: 0
```

In short:
- Multiple game sessions with different `gameId`s (`Go2I6xSnUrrvh1TAdhPwT`, `C5KPbZsw5wd9cOV1MCE7p`)
- AI making moves in one game while another game ends
- Proper session cleanup when games finish
- Session isolation (no interference between games)



## Key Features of the Overall Architecture

### True Concurrency
- Each AI session has its own WebSocket connection
- Multiple games can run simultaneously without interference
- Sessions are completely isolated from each other

### Session Management
- Automatic session creation when games start
- Proper cleanup when games end
- Auto-cleanup after 5 minutes to prevent memory leaks
- Session tracking and monitoring

### Intelligent AI Behavior
- Physics-based ball trajectory prediction
- Strategic positioning when ball is moving away
- Human-like imperfections (prediction errors, reaction delays)
- Adaptive behavior based on ball speed

### Robust Communication
- WebSocket-based real-time communication
- Message routing based on gameId
- Error handling and connection management
- Graceful disconnection handling

## API Endpoints

### AI Service (Port 8086)

- `POST /join-game/{gameId}` - Create AI session for specific game
- `GET /sessions` - List all active AI sessions
- `DELETE /session/{gameId}` - End specific AI session
- `POST /session` - Create new AI session (legacy)

### Backend Integration

- WebSocket connection with `AI_SERVICE_TOKEN` protocol
- HTTP calls to AI service for session management
- Message forwarding between AI and game service

## Configuration

The AI service uses `configuration.json` for:
- Game physics parameters
- Field dimensions
- Wall positions
- AI behavior settings

## Testing

### Test AI Logic in Isolation
```bash
cd ai-service
npx ts-node test-ai.ts
```

### Test Full System
```bash
# Start all services
docker-compose up --build

# Test PVC matchmaking
curl -X POST http://localhost:8082/matchmaking \
  -H "Content-Type: application/json" \
  -d '{"mode": "pvc"}'

# Check active AI sessions
curl http://localhost:8086/sessions
```

### Monitor Logs
```bash
docker-compose logs -f ai-service backend game-service
```

## Benefits of This Architecture

1. **Scalability**: Supports unlimited concurrent AI games
2. **Isolation**: Each game session is completely independent
3. **Reliability**: Proper error handling and cleanup
4. **Intelligence**: Advanced AI algorithm with human-like behavior
5. **Maintainability**: Clean separation of concerns
6. **Performance**: Efficient message routing and processing

## Troubleshooting

### Common Issues

1. **AI not moving**: Check if AI session was created and connected
2. **Multiple AI sessions**: Verify each game has its own session
3. **Connection errors**: Check WebSocket connection and token
4. **Game state issues**: Verify game state includes all required data

### Debug Commands

```bash
# Check AI service logs
docker-compose logs ai-service

# Check backend logs
docker-compose logs backend

# Check active sessions
curl http://localhost:8086/sessions

# Restart AI service
docker-compose restart ai-service
```

This architecture provides a robust, scalable, and intelligent AI system that enhances the gaming experience while maintaining clean separation between services.
```

