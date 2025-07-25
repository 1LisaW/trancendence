import jwt, { JwtPayload } from "jsonwebtoken";
import fastify from "fastify";
import { addNewTournamentUser, addTournamentMatch, createNewScoreRecord, createNewTournamentRecord, deleteTournament, finishTournament, getActiveTournament, getAllTournamentsHistory, getAllUserScores, getTournamentHistory, getTournamentUsers, getUsersTournamentHistory, initDB } from "./sqlite";
import { SCORE_GetUserScoreRequestParams, SCORE_PostNewScoreReply, SCORE_PostNewScoreRequestBody, SCORE_ScoreDTO, SCORE_ServerErrorReply } from "./model";

const PORT = 8084;


const Fastify = fastify({ logger: true });

Fastify.register(async function (fastify) {
	await initDB();
	Fastify.post<{ Body: SCORE_PostNewScoreRequestBody, Reply: SCORE_PostNewScoreReply }>('/score', async (request, reply) => {
		try {
			const { first_user_id, second_user_id, first_user_name, second_user_name, score, game_results, game_mode } = request.body;

			const user = await createNewScoreRecord(first_user_id, second_user_id, first_user_name, second_user_name, score,game_results, game_mode);
			reply.send({ message: "Score record created" });
		} catch (e) {
			reply.send({ message: "Error", details: e });
		}
	})


	Fastify.get<{ Params: SCORE_GetUserScoreRequestParams, Reply: { scores: SCORE_ScoreDTO[], user_id: number } | SCORE_ServerErrorReply }>('/score/:user_id', async (request, reply) => {
		const user_id = request.params.user_id;

		try {
			const response = await getAllUserScores(user_id);
			reply.send({ ...response, user_id });
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})


	Fastify.get('/tournament/init', async (request, reply) => {
		console.log(`**SCORE** /tournament/init get`);
		try {
			const response = await getActiveTournament();
			console.log(`	**SCORE** /tournament/init get ${JSON.stringify(response)}`);

			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Params: {user_id: number}}>('/tournament/user/:user_id', async (request, reply) => {
		const user_id = request.params.user_id;
		console.log(`**SCORE** /tournament/user/:user_id  get`);

		if (!user_id) {
			reply.status(400).send({ error: "Bad request", details: "Incorrect user id" });
			return;
		}
		try {
			const response = await getUsersTournamentHistory(user_id);
			console.log(`	**SCORE**  /tournament/user/:user_id get ${JSON.stringify(response)}`);

			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Params: {tournament_id: number}}>('/tournament/tournament/:tournament_id', async (request, reply) => {
		const tournament_id = request.params.tournament_id;
		console.log(`**SCORE** /tournament/user/:user_id  get   tournament_id: ${tournament_id}`);

		if (!tournament_id) {
			reply.status(400).send({ error: "Bad request", details: "Incorrect tournament id" });
			return;
		}
		try {
			const response = await getTournamentHistory(tournament_id);
		console.log(`	**SCORE** /tournament/user/:user_id  get   tournament_id: ${JSON.stringify(response)}`);

			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.delete<{Params:{tournament_id: number}}>('/tournament/tournament/:tournament_id', async (request, reply) => {
		const tournament_id = request.params.tournament_id;
		console.log(`**SCORE** /tournament/tournament/:tournament_id  delete   tournament_id: ${tournament_id}`);

		if (!tournament_id) {
			reply.status(400).send({ error: "Bad request", details: "Incorrect tournament id" });
			return;
		}
		try {
			const response = await deleteTournament(tournament_id);
			console.log(`	**SCORE** /tournament/tournament/:tournament_id  delete  ${JSON.stringify(response)}}`);

			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})


	Fastify.post<{Body: {users: number[]}}>('/tournament/new', async (request, reply) => {
		const users = request.body.users;
		console.log(`**SCORE** /tournament/new  post   users: ${JSON.stringify(users)}`);

		if (!users || users.length < 3) {
			reply.status(400).send({ error: "Bad request", details: "Not enough users" });
			return;
		}
		try {
			const response = await createNewTournamentRecord(users);
			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})


	Fastify.post<{Body: {tournament_id: number}}>('/tournament/finish', async (request, reply) => {
		const tournament_id = request.body.tournament_id;
		console.log(`**SCORE** /tournament/finish  post   tournament_id: ${tournament_id}`);

		if (!tournament_id) {
			reply.status(400).send({ error: "Bad request", details: "Not enough users" });
			return;
		}
		try {
			const response = await finishTournament(tournament_id);
			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.post<{Params: {tournament_id: number}, Body: {user_id: number}}>('/tournament/users/:tournament_id', async (request, reply) => {
		const tournament_id = request.params.tournament_id;
		const user_id = request.body.user_id;
		console.log(`**SCORE** /tournament/users/:tournament_id  post   tournament_id: ${tournament_id}, user_id: ${user_id}`);

		if (!tournament_id || !user_id ) {
			reply.status(400).send({ error: "Bad request", details: "Incorrect user id" });
			return {tournament_id, user_id};
		}
		try {
			const response = await addNewTournamentUser(tournament_id, user_id);
			reply.send(response);

		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.post<{Params:{tournament_id: number}, Body: SCORE_PostNewScoreRequestBody}>('/tournament/score/:tournament_id', async (request, reply) => {
		const id = request.params.tournament_id;
		console.log(`**SCORE** /tournament/score/:tournament_id  post   tournament_id: ${id}, body: ${JSON.stringify(request.body)}`);

		const { first_user_id, second_user_id, first_user_name, second_user_name, score, game_results, game_mode } = request.body;
		if (!first_user_id || !second_user_id || !first_user_name || !second_user_name || !score || !game_results || !game_mode) {
			reply.status(400).send({ error: "Bad request", details: "Not enough data" });
			return;
		}

		try {
			const response = await addTournamentMatch(id, first_user_id, second_user_id, first_user_name, second_user_name, game_results, score, game_mode);
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
