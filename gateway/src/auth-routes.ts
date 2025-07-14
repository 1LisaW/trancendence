import { FastifyInstance } from "fastify";
import {
	GW_IsAuthDTO, AUTH_LoginRequestBody, AUTH_LoginDTO, AUTH_ServerErrorDTO, AUTH_SignInRequestBody, AUTH_CreateUserDTO,
	AUTH_ProfileUpdateRequestBody,
	AUTH_ProfileUpdateResponse,
	AUTH_AuthErrorDTO,
	AUTH_ProfileDTO,
} from "./auth-model";

export interface GoogleAuthRequestBody {
	idToken: string;
}

export interface GoogleAuthResponse {
	token?: string;
	error?: string;
	user?: {
		id: number;
		name: string;
		email: string;
		avatar?: string;
	};
	needsUsername?: boolean; // Add this field
	googleUser?: {
		email: string;
		name: string;
		picture?: string;
	};
}

const registerAuthRoutes = (Fastify: FastifyInstance, AUTH_SERVICE: string) => {
	Fastify.get<{
		Reply: GW_IsAuthDTO
	}>('/auth/is-auth',
		async (request, reply) => {
			const token = request.headers.authorization || '';
			const { status, isAuth } = await Fastify.isAuthenticated(token);
			reply.status(status).send({ isAuth });
		});

	Fastify.post<{ Body: AUTH_LoginRequestBody, Reply: AUTH_LoginDTO | AUTH_ServerErrorDTO }>('/auth/login',
		async (request, reply) => {
			try {
				await Fastify.proxyRequest<AUTH_LoginDTO | AUTH_ServerErrorDTO>(
					`${AUTH_SERVICE}/login`, 'POST', request, reply, false
				);
			} catch (e) {
				reply.status(500).send({ error: "Server error" });
			}
		});
	Fastify.post<{
		Body: AUTH_SignInRequestBody,
		Reply: AUTH_CreateUserDTO
	}>('/auth/signup',
		async (request, reply) => {
			try {
				await Fastify.proxyRequest<AUTH_CreateUserDTO>(
					`${AUTH_SERVICE}/signup`, 'POST', request, reply, false
				);
			} catch (e) {
				reply.send({
					status: 500,
					err: {
						field: undefined,
						message: 'Server error',
						err_code: 'server-error'
					}
				});
			}
		});


	Fastify.get(
		'/auth/user',
		async (request, reply) => {
			// const token = request.headers.authorization || '';
			try {
				await Fastify.proxyRequest<any>(
					`${AUTH_SERVICE}/user`, 'GET', request, reply, true
				);
			} catch (e) {
				reply.status(500).send({ error: "Server error" });
			}
		});

	Fastify.post<{
		Body: AUTH_ProfileUpdateRequestBody,
		Reply: AUTH_ProfileUpdateResponse | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO
	}>('/auth/profile',
		async (request, reply) => {
			const token = request.headers.authorization || '';

			const isAuthResponse = await Fastify.isAuthenticated(token);
			if (!isAuthResponse.isAuth)
				return reply.status(401).send({ error: 'Access denied' });
			try {
				await Fastify.proxyRequest<AUTH_ProfileUpdateResponse | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO>(
					`${AUTH_SERVICE}/profile`, 'POST', request, reply, true
				);

			} catch (e) {
				reply.status(500).send({ error: "Server error", details: e });
			}
		})

	Fastify.get<{
		Reply: AUTH_ProfileDTO | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO
	}>('/auth/profile',
		async (request, reply) => {
			const token = request.headers.authorization || '';

			const isAuthResponse = await Fastify.isAuthenticated(token);
			if (!isAuthResponse.isAuth)
				return reply.status(401).send({ error: 'Access denied' });
			try {
				await Fastify.proxyRequest<AUTH_ProfileDTO | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO>(
					`${AUTH_SERVICE}/profile`, 'GET', request, reply, true
				);
			} catch (e) {
				reply.status(500).send({ error: "Server error", details: e });
			}
		})

	Fastify.post<{ Body: GoogleAuthRequestBody, Reply: GoogleAuthResponse }>('/auth/google-auth',
		async (request, reply) => {
			try {
				await Fastify.proxyRequest<GoogleAuthResponse>(
					`${AUTH_SERVICE}/google-auth`, 'POST', request, reply, false
				);
			} catch (e) {
				reply.status(500).send({ error: "Server error" });
			}
		});

	Fastify.post<{ Body: { username: string, email: string, googleId: string }, Reply: GoogleAuthResponse }>('/auth/google-complete',
		async (request, reply) => {
			try {
				await Fastify.proxyRequest<GoogleAuthResponse>(
					`${AUTH_SERVICE}/google-complete`, 'POST', request, reply, false
				);
			} catch (e) {
				reply.status(500).send({ error: "Server error" });
			}
		});
}

export default registerAuthRoutes;
