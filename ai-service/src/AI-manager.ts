import { AISession } from './AI-session';
import { nanoid } from 'nanoid';

export class AIManager {
  private sessions = new Map<string, AISession>();
  private static instance: AIManager;


  constructor() {
    if (AIManager.instance) {
      throw new Error("AIManager is a singleton");
    }
    AIManager.instance = this;
  }

  static getInstance(): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager();
    }
    return AIManager.instance;
  }

  // Route incoming messages to the correct session
  routeMessage(msg: any): boolean {
    if (msg.gameId && this.sessions.has(msg.gameId)) {
      const session = this.sessions.get(msg.gameId);
      if (session) {
        session.handleMessage(msg);
        return true;
      }
    }
    return false;
  }

  getSession(gameId: string): AISession | undefined {
    return this.sessions.get(gameId);
  }


  createSession(backendUrl: string, token: string): string {
    const gameId = nanoid();
    const session = new AISession(gameId, backendUrl, token);
    this.sessions.set(gameId, session);
    
    // Auto-cleanup after session ends
    setTimeout(() => {
      if (this.sessions.has(gameId)) {
        console.log(`Auto-cleaning up session ${gameId}`);
        this.endSession(gameId);
      }
    }, 300000); // 5 minutes max session time
    
    return gameId;
  }

  createSessionForGame(gameId: string, backendUrl: string, token: string): string {
    if (this.sessions.has(gameId)) {
      console.log(`AI session already exists for game ${gameId}`);
      return gameId;
    }
    
    const session = new AISession(gameId, backendUrl, token);
    this.sessions.set(gameId, session);
    
    console.log(`Created AI session for game ${gameId}. Total sessions: ${this.sessions.size}`);
    
    // Auto-cleanup for specific game sessions too
    setTimeout(() => {
      if (this.sessions.has(gameId)) {
        console.log(`Auto-cleaning up game session ${gameId}`);
        this.endSession(gameId);
      }
    }, 300000); // 5 minutes max
    
    return gameId;
  }

  endSession(gameId: string) {
    const session = this.sessions.get(gameId);
    if (session) {
      session.close();
      this.sessions.delete(gameId);
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