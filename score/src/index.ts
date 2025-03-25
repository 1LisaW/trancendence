import jwt, { JwtPayload } from "jsonwebtoken";
import fastify from "fastify";
import { createNewScoreRecord, getAllUserScores, initDB } from "./sqlite";
import { SCORE_GetUserScoreRequestParams, SCORE_PostNewScoreReply, SCORE_PostNewScoreRequestBody, SCORE_ScoreDTO, SCORE_ServerErrorReply } from "./model";

const PORT = 8084;


const Fastify = fastify({logger: true});

Fastify.register(async function (fastify) {
	await initDB();
	Fastify.post<{ Body: SCORE_PostNewScoreRequestBody, Reply: SCORE_PostNewScoreReply }>('/score', async (request, reply) => {
		console.log("score data post request ", request.body);
		try {
			const { first_user_id, second_user_id, first_user_name, second_user_name, score, game_mode } = request.body;

			const user = await createNewScoreRecord(first_user_id, second_user_id, first_user_name, second_user_name, score, game_mode);
			reply.send({message: "Score record created"});
		} catch (e) {
			reply.send({ message: "Error", details: e });
		}
	})


	Fastify.get<{Params: SCORE_GetUserScoreRequestParams, Reply: {scores: SCORE_ScoreDTO[], user_id: number} | SCORE_ServerErrorReply}>('/score/:user_id', async(request, reply) => {
		// const token = request.headers.authorization || '';
		const user_id = request.params.user_id;

		// if (!token) return reply.status(401).send({ error: 'Access denied' });
		try {
			// const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const response = await getAllUserScores(user_id);
			reply.send({...response, user_id});
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})
})

Fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
	console.log("Server started");
	if (err) {
	  Fastify.log.error(err);
	  console.log(err);
	  process.exit(1);
	}
	console.log(`Server listening at: ${address}`);
  })
