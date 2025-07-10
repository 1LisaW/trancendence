// ai-service/src/api.ts

// Centralized backend config
export const BACKEND_HOSTNAME = 'backend';
export const BACKEND_PORT = 8082;
export const BACKEND_WS_URL = `ws://${BACKEND_HOSTNAME}:${BACKEND_PORT}/game`;