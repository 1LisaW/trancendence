import jwt, { JwtPayload } from "jsonwebtoken";
import fastify from "fastify";

const PORT = 8087;


const Fastify = fastify({ logger: true });

Fastify.register(async function (fastify) {

	Fastify.get('/chat/help', async (request, reply) => {
		const helpMessage = '\\help - show list of commands\n\\friend @username - add username as friend\n \\unfriend @username - remove username as friend\n \\block @username - block username in chat\n';
		reply.send({

			message: helpMessage});
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
