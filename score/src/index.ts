import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import fastify from "fastify";
import { fetchAll, fetchFirst, execute } from "./sql";
import { request } from "http";
import { createNewScoreRecord, getAllUserScores, initDB } from "./sqlite";

const PORT = 8084;

interface ScoreRequestBody {
	first_user_id: string,
	second_user_id: string,
	first_user_name: string,
	second_user_name: string,
	score: number[],
	game_mode: string
}

const Fastify = fastify({logger: true});

Fastify.register(async function (fastify) {
	await initDB();
	Fastify.post<{ Body: ScoreRequestBody }>('/score', async (request, reply) => {
		console.log("score data post request ", request.body);
		try {
			const { first_user_id, second_user_id, first_user_name, second_user_name, score, game_mode } = request.body;

			const user = await createNewScoreRecord(first_user_id, second_user_id, first_user_name, second_user_name, score, game_mode);
			reply.send({message: "Score record created"});
		} catch (e) {
			reply.send({ message: "Error", details: e });
		}
	})
	interface scoreRequestParams {
		user_id: number
	}

	Fastify.get('/score', async(request, reply) => {
		const token = request.headers.authorization;

		if (!token) return reply.status(401).send({ error: 'Access denied' });
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const response = await getAllUserScores(decoded.userId);
			reply.send({score: response});
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Params: scoreRequestParams}>('/score/:user_id', async(request, reply) => {
		const token = request.headers.authorization;
		const user_id = request.params.user_id;

		if (!token) return reply.status(401).send({ error: 'Access denied' });
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const response = await getAllUserScores(user_id);
			reply.send(response);
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
