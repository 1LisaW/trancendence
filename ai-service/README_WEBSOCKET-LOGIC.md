# WebSocket Logic in AI-Service

This document provides an overview of the WebSocket logic used in the `ai-service` for the `ft_transcendence` Pong project. It explains how WebSocket connections are managed to facilitate AI moves in Player vs Computer (PvC) mode and addresses whether this logic could contribute to visualization issues when multiple browser windows are open.

## Overview of WebSocket Logic in `ai-service`
The `ai-service` uses WebSocket to communicate with the backend/game service for managing AI moves in Player vs Computer (PvC) mode. The relevant files for WebSocket logic are primarily `AI-session.ts`, `AI-environment.ts`, and `AI-manager.ts`. Below, we walk through how WebSockets are handled in this service to determine if there’s anything that might cause issues with multiple browser windows.

## Step-by-Step Analysis of WebSocket Logic

### 1. WebSocket Initialization in `AI-session.ts`
- **Where**: In the constructor of the `AISession` class, a WebSocket connection is established to the backend using the provided `backendUrl` and a token for authentication.
- **Code Reference**: The WebSocket (`this.ws`) is created with a URL that includes the `gameId` and `token` as query parameters to uniquely identify the game session.
- **Purpose**: This connection allows the AI service to receive game state updates and send AI moves for a specific game.
- **Key Observation**: Each `AISession` instance is tied to a unique `gameId`. The WebSocket connection is per game session, not per user or browser window. This means the AI service doesn't directly interact with how many browser windows a user has open; it only cares about the game ID.

### 2. Handling WebSocket Messages in `AI-session.ts`
- **Where**: The `handleMessage` method processes incoming messages from the backend via WebSocket.
- **Code Reference**: Messages are parsed as JSON and handled based on their type (e.g., `game-setup`, `game-state`, `game-end`).
- **Purpose**:
  - `game-setup` sets up the AI's order (which player it is) and starts a countdown.
  - `game-state` updates trigger the AI to calculate and send a move using `getAIMove` from `ai-logic.ts` if the game is in the `PLAYING` state.
  - `game-end` closes the session.
- **Key Observation**: The logic here is reactive to game state updates for a specific `gameId`. There's no logic to handle multiple connections from the same user or to detect multiple browser windows. The AI simply responds to the game state it receives, regardless of how many clients are rendering the game.

### 3. Sending AI Moves via WebSocket in `AI-environment.ts`
- **Where**: The `sendAIMove` method in the `AIEnvironment` class sends the AI's move ('up', 'down', or 'none') to the backend.
- **Code Reference**: It uses `this.ws.send()` to send a JSON message with the `gameId` and a `step` value (-1 for up, 1 for down, or nothing for 'none').
- **Purpose**: This simulates keyboard input by sending discrete moves to the game service.
- **Key Observation**: The move is sent for a specific `gameId`, and there's a safety check to avoid sending moves during countdown. Importantly, there's no mechanism in this code to account for multiple browser windows or to send different moves based on the number of connected clients. It's purely game-ID driven.

### 4. Session Management in `AI-manager.ts`
- **Where**: The `AIManager` class manages multiple AI sessions, creating and ending them as needed.
- **Code Reference**: Sessions are stored in a Map with `gameId` as the key. Methods like `createSessionForGame` and `endSession` handle the lifecycle of AI sessions.
- **Purpose**: Ensures that each game has one AI session if it's PvC mode.
- **Key Observation**: The manager prevents duplicate AI sessions for the same `gameId` (it checks if a session already exists). This means that even if multiple browser windows are open, the AI service won't create multiple sessions for the same game, avoiding duplicate AI moves for a single game instance.

### 5. Closing WebSocket Connections in `AI-session.ts`
- **Where**: The `close` method terminates the WebSocket connection and cleans up resources.
- **Code Reference**: It calls `this.ws.close()` and clears intervals/timers.
- **Purpose**: Ensures that when a game ends, the AI session is properly closed.
- **Key Observation**: There's an auto-cleanup mechanism in `AIManager` (5-minute timeout) to end sessions, which prevents lingering connections. However, this is unrelated to multiple browser windows since it's tied to `gameId`, not user sessions.

## Conclusion on `ai-service` WebSocket Logic
After reviewing the WebSocket logic in `ai-service`, it is clear that there are no apparent issues in this service that would cause visualization problems when opening multiple browser windows. Here's why:
- **Game-ID Focus**: The WebSocket connections and message handling are tied to a unique `gameId`, not to the user's browser windows or sessions. The AI service doesn't have logic to detect or respond to multiple windows.
- **Single Session per Game**: The `AIManager` ensures only one AI session exists per `gameId`, preventing duplicate AI moves or conflicting WebSocket messages for the same game.
- **No Client-Side Awareness**: The `ai-service` operates server-side and is unaware of how many browser windows or tabs a user has open. It simply sends moves based on the game state it receives from the backend.

## Implications for Visualization Issues
Given the above analysis, visualization issues observed when opening multiple browser windows are unlikely to originate from the `ai-service`. Such issues are more likely related to:
- **Frontend (`ping-pong-frontend`)**: The frontend might be connecting to the same WebSocket endpoint or game session from multiple windows, causing conflicting state updates or rendering issues.
- **Game Service (`game-service`)**: The backend might be sending game state updates to multiple client connections for the same user or game without proper session isolation, leading to inconsistent rendering.

For further troubleshooting, it is recommended to investigate the WebSocket connection management in the frontend (`ping-pong-frontend/src/pages/Game/App/App.ts`) and session handling in the game service (`game-service/src/index.ts` and `GameSession.ts`).