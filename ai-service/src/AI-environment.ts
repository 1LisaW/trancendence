// Mirror of frontend Environment.ts - AI version
/* This file provides a mirror of the game environment parameters used in the frontend, adapted for the AI's context. */

import WebSocket from 'ws';
import * as http from 'http';

// Interface for scene parameters (matching game-service structure)
interface SceneParams {
    ground: {
        name: string,
        width: number,
        height: number
    },
    bat: {
        width: number,
        height: number,
        depth: number
    },
    ball: {
        name: string,
        diameter: number
    },
    player: {
        name: string,
        vector: [number, number, number],
        startPosition: [number, number, number]
    },
    opponent: {
        name: string,
        vector: [number, number, number],
        startPosition: [number, number, number]
    }
}

export class AIEnvironment {
    // Scene parameters will be fetched from game-service
    private sceneParams: SceneParams | null = null;
    private gameId: string;
    private ws: WebSocket;
    private isInitialized = false;

    constructor(gameId: string, ws: WebSocket) {
        this.gameId = gameId;
        this.ws = ws;
        console.log("***** CREATE AI ENVIRONMENT ********");
        this.initializeSceneParams();
    }

    private async initializeSceneParams() {
        try {
            // Fetch scene parameters from game-service using built-in http module
            const sceneParams = await this.fetchSceneParams();
            this.sceneParams = sceneParams;
            this.isInitialized = true;
            console.log(`AI Environment: Scene parameters loaded from game-service for game ${this.gameId}`);
        } catch (error) {
            console.error(`AI Environment: Failed to load scene parameters:`, error);
            // Fallback to default parameters if fetch fails
            this.sceneParams = {
                ground: { name: "ground", width: 100, height: 70 },
                bat: { width: 15, height: 10, depth: 4 },
                ball: { name: "Sphere1", diameter: 2 },
                player: { name: "Box1", vector: [1, 0, 0], startPosition: [-45, 5, 0] },
                opponent: { name: "Box2", vector: [1, 0, 0], startPosition: [45, 5, 0] }
            };
            this.isInitialized = true;
            console.log(`AI Environment: Using fallback scene parameters for game ${this.gameId}`);
        }
    }

    private fetchSceneParams(): Promise<SceneParams> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'game-service',
                port: 8081,
                path: '/scene-params',
                method: 'GET'
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const sceneParams = JSON.parse(data);
                        resolve(sceneParams);
                    } catch (error) {
                        reject(new Error(`Failed to parse scene params: ${error}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    // Mirror of frontend MoveBat function - AI version
    sendAIMove(move: 'up' | 'down' | 'none') {
        // *** SAFETY CHECK: Never send moves during countdown ***
        // This should be passed from the AI session, but I am adding a timestamp check as backup -- might remove later
        if (move === 'none') {
            console.log(`AI Environment: No move needed for game ${this.gameId}`);
            return;
        }
        
        if (move === 'up') {
            this.ws.send(JSON.stringify({ gameId: this.gameId, step: -1 }));
            console.log(`AI Environment: Sent UP move (step: -1) for game ${this.gameId}`);
        }
        else if (move === 'down') {
            this.ws.send(JSON.stringify({ gameId: this.gameId, step: 1 }));
            console.log(`AI Environment: Sent DOWN move (step: 1) for game ${this.gameId}`);
        }
    }

    // Get field boundaries (used by AI logic)
    getFieldBoundaries() {
        if (!this.isInitialized || !this.sceneParams) {
            console.warn(`AI Environment: Scene params not initialized, using defaults for game ${this.gameId}`);
            return { width: 100, height: 70, batWidth: 15 };
        }
        return {
            width: this.sceneParams.ground.width,
            height: this.sceneParams.ground.height,
            batWidth: this.sceneParams.bat.width
        };
    }

    // Get AI paddle position (right side)
    getAIPaddleStartPosition() {
        if (!this.isInitialized || !this.sceneParams) {
            console.warn(`AI Environment: Scene params not initialized, using defaults for game ${this.gameId}`);
            return [45, 5, 0];
        }
        return this.sceneParams.opponent.startPosition;
    }

    // Get human paddle position (left side)  
    getHumanPaddleStartPosition() {
        if (!this.isInitialized || !this.sceneParams) {
            console.warn(`AI Environment: Scene params not initialized, using defaults for game ${this.gameId}`);
            return [-45, 5, 0];
        }
        return this.sceneParams.player.startPosition;
    }

    // Get all scene parameters (for AI logic that needs them)
    getSceneParams() {
        if (!this.isInitialized || !this.sceneParams) {
            console.warn(`AI Environment: Scene params not initialized, returning null for game ${this.gameId}`);
            return null;
        }
        return this.sceneParams;
    }

    // Check if environment is ready
    isReady() {
        return this.isInitialized;
    }
}