import { AISession } from './AI-session';
import { nanoid } from 'nanoid';

export class AIManager {
  private sessions = new Map<string, AISession>();
  private usersAISession: Map<number, AISession> = new Map(); // user_id : ai_id
  private static instance: AIManager;


  constructor() {
    if (AIManager.instance) {
      throw new Error("AIManager is a singleton");
    }
    AIManager.instance = this;
  }

  createUserAISession(userId: number) {
    this.usersAISession.set(userId, new AISession(userId));
  }


  static getInstance(): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager();
    }
    return AIManager.instance;
  }

  // Route incoming messages to the correct session
  routeMessage(msg: any): boolean {
    // ✅ FIXED: Handle game setup messages and cleanup old sessions
    if (msg.gameId && msg.order !== undefined) {
      // This is a new game setup - clean up any old sessions for this user
      const userId = this.getUserIdFromMessage(msg);
      if (userId) {
        this.cleanupUserSessions(userId);
      }
      
      // Create new session and add to both maps
      const newSession = new AISession(userId || -1);
      this.sessions.set(msg.gameId, newSession);
      if (userId) {
        this.usersAISession.set(Math.abs(userId), newSession);
      }
      
      console.log(`✅ AI Manager: Created new session ${msg.gameId} for user ${userId}`);
      newSession.handleMessage(msg);
      return true;
    }
    
    // Route regular messages to existing sessions
    if (msg.gameId && this.sessions.has(msg.gameId)) {
      const session = this.sessions.get(msg.gameId);
      if (session) {
        session.handleMessage(msg);
        return true;
      }
    }
    return false;
  }

  // ✅ NEW: Extract user ID from message
  private getUserIdFromMessage(msg: any): number | null {
    // Look for negative user IDs in the message (AI players)
    if (msg.players && Array.isArray(msg.players)) {
      const aiId = msg.players.find((id: number) => id < 0);
      return aiId || null;
    }
    return null;
  }

  // ✅ NEW: Clean up old sessions for a specific user
  private cleanupUserSessions(userId: number) {
    const absUserId = Math.abs(userId);
    
    // Find and clean up old session for this user
    const oldSession = this.usersAISession.get(absUserId);
    if (oldSession) {
      // Find the gameId for this old session
      for (const [gameId, session] of this.sessions.entries()) {
        if (session === oldSession) {
          console.log(`🧹 AI Manager: Cleaning up old session ${gameId} for user ${userId}`);
          session.close();
          this.sessions.delete(gameId);
          break;
        }
      }
      this.usersAISession.delete(absUserId);
    }
  }

  getSession(gameId: string): AISession | undefined {
    return this.sessions.get(gameId);
  }


  // createSession(backendUrl: string, token: string): string {
  //   // const gameId = nanoid();
  //   // const user_id = this.usersAISession.values();
  //   const session = new AISession(gameId, backendUrl, token);
  //   this.sessions.set(gameId, session);

  //   // Auto-cleanup after session ends
  //   setTimeout(() => {
  //     if (this.sessions.has(gameId)) {
  //       console.log(`Auto-cleaning up session ${gameId}`);
  //       this.endSession(gameId);
  //     }
  //   }, 300000); // 5 minutes max session time

  //   return gameId;
  // }

  // createSessionForGame(gameId: string, backendUrl: string, token: string): string {
  //   if (this.sessions.has(gameId)) {
  //     console.log(`AI session already exists for game ${gameId}`);
  //     return gameId;
  //   }

  //   const session = new AISession(gameId, backendUrl, token);
  //   this.sessions.set(gameId, session);

  //   console.log(`Created AI session for game ${gameId}. Total sessions: ${this.sessions.size}`);

  //   // Auto-cleanup for specific game sessions too
  //   setTimeout(() => {
  //     if (this.sessions.has(gameId)) {
  //       console.log(`Auto-cleaning up game session ${gameId}`);
  //       this.endSession(gameId);
  //     }
  //   }, 300000); // 5 minutes max

  //   return gameId;
  // }

  endSession(gameId: string) {
    const session = this.sessions.get(gameId);
    if (session) {
      session.close();
      this.sessions.delete(gameId);
      
      // ✅ FIXED: Also clean up user session mapping
      for (const [userId, userSession] of this.usersAISession.entries()) {
        if (userSession === session) {
          this.usersAISession.delete(userId);
          console.log(`🧹 AI Manager: Removed user ${userId} session mapping`);
          break;
        }
      }
      
      console.log(`Session ${gameId} ended and removed. Remaining sessions: ${this.sessions.size}`);
    }
  }


  // Clean up all sessions
  cleanup() {
    console.log(`Cleaning up ${this.sessions.size} active sessions`);
    this.sessions.forEach((session, gameId) => {
      this.endSession(gameId);
    });
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}
