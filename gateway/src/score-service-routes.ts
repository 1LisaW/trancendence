import { FastifyInstance } from "fastify";
import { SCORE_GetUserScoreRequestParams, SCORE_ScoreDTO, SCORE_ServerErrorReply } from "./score-service-model";

const registerScoreServiceRoutes = (Fastify: FastifyInstance, SCORE_SERVICE: string) => {
	Fastify.get<{ Reply: { scores: SCORE_ScoreDTO[] } | SCORE_ServerErrorReply }>('/score/score', async (request, reply) => {
		const token = request.headers.authorization || '';

		const isAuthResponse = await Fastify.isAuthenticated(token);
		if (!isAuthResponse.isAuth)
			return reply.status(401).send({ error: 'Access denied' });
		const user_id = isAuthResponse.user_id;
		try {
			if (user_id)
				await Fastify.proxyRequest<{ scores:SCORE_ScoreDTO[] } | SCORE_ServerErrorReply>(
					`${SCORE_SERVICE}/score/${user_id}`, 'GET', request, reply, true
			);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{ Params: SCORE_GetUserScoreRequestParams, Reply: { scores: SCORE_ScoreDTO[] } | SCORE_ServerErrorReply }>('/score/:user_id', async (request, reply) => {
		const token = request.headers.authorization || '';

		const isAuthResponse = await Fastify.isAuthenticated(token);
		if (!isAuthResponse.isAuth)
			return reply.status(401).send({ error: 'Access denied' });
		const user_id = request.params.user_id;

		try {
			await Fastify.proxyRequest<{ scores:SCORE_ScoreDTO[], user_id: number } | SCORE_ServerErrorReply>(
				`${SCORE_SERVICE}/score/:user_id`, 'GET', request, reply, true
			);
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{ Params: SCORE_GetUserScoreRequestParams, Reply: { scores: SCORE_ScoreDTO[] } | SCORE_ServerErrorReply }>('/score/tournament/user', async (request, reply) => {
		const token = request.headers.authorization || '';

		const isAuthResponse = await Fastify.isAuthenticated(token);
		if (!isAuthResponse.isAuth)
			return reply.status(401).send({ error: 'Access denied' });
		const user_id = isAuthResponse.user_id;

		try {
			await Fastify.proxyRequest<{ scores:SCORE_ScoreDTO[], user_id: number } | SCORE_ServerErrorReply>(
				`${SCORE_SERVICE}/tournament/user/${user_id}`, 'GET', request, reply, true
			);
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})
}

export default registerScoreServiceRoutes;
