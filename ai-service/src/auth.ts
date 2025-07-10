// ai-service/src/auth.ts
// for Tatiana: this is just an idea feel free to remove if you wish to do AI authentication in the backend

export async function getAIToken(): Promise<string> {
  return 'AI_SERVICE_TOKEN'; // Simple AI token that the backend will recognize
}

export async function initializeAI(): Promise<string> {
  return await getAIToken(); // we just return the token for now
} 