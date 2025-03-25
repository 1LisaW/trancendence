import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { AUTH_IsAuthResponse } from "./auth-model";
import registerAuthRoutes from "./auth-routes";
import registerScoreServiceRoutes from "./score-service-routes";

const PORT = 8085;

const SERVICES = {
	AUTH: "http://auth:8083",
	SCORE: "http://score:8084",
	GAME_SERVICE: "http://game-service:8081"
}

const Fastify = fastify({ logger: true });

Fastify.decorate('isAuthenticated', async (token: string): Promise<{ status: number, user_id: number | undefined, isAuth: boolean }> => {
	try {
		const response = await fetch(`${SERVICES.AUTH}/is-auth`, {
			method: "GET",
			headers: {
				"Authorization": token,
			},
		});
		const json: AUTH_IsAuthResponse = await response.json();
		if (json.error) {
			return ({ status: response.status, user_id: json.userId, "isAuth": false });
		}
		return ({ status: response.status, user_id: json.userId, "isAuth": true });
	} catch (e) {
		return ({ status: 500, user_id: undefined, "isAuth": false });

	}
});



Fastify.decorate('proxyRequest', async<T>(
	path: string,
	method: string,
	request: FastifyRequest,
	reply: FastifyReply,
	isAuth: boolean
): Promise<T> => {
	const init: RequestInit = {};
	init.method = method;
	if (request.body) {
		init.headers = {};
		init.headers["Content-Type"] = "application/json";
		init.body = JSON.stringify(request.body);
	}
	if (isAuth) {
		init.headers = init.headers || {};
		init.headers["Authorization"] = request.headers.authorization || '';
	}
	const response = await fetch(path, init);
	const json = await response.json();
	return reply.status(response.status).send(json);
})

Fastify.register(async function (fastify) {

	// auth service
	registerAuthRoutes(Fastify, SERVICES.AUTH);
	registerScoreServiceRoutes(Fastify, SERVICES.SCORE);
	// score service

});

Fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	console.log("Server GATEWAY started");
	if (err) {
		Fastify.log.error(err);
		console.log(err);
		process.exit(1);
	}
	console.log(`Server listening at: ${address}`);
})
