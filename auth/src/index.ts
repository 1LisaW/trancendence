import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import fastify from "fastify";
import { fetchAll, fetchFirst, execute } from "./sql";
import { createNewUser, createUser, getUserByEmail, getUserByEmailAndPassword, getUserByName, UserDTO, initDB, getUserById } from "./sqlite";
import { request } from "http";

dotenv.config();

const PORT = 8083;

const try_do = async () => {
	await initDB();

	// const name = "Ivanka";
	// const user1 = await createUser(name, "ivan@mail.com", "54635462");
	// const user2 = await createUser(name, "ivan2@mail.com", "54635462");
	// console.log(user1);
	// console.log(user2);
	const user3 = await getUserByEmailAndPassword("ivan@mail.com", "546354629");
	const user4 = await getUserByEmailAndPassword("ivan2@mail.com", "54635462");
	console.log(user3);
	console.log(user4);
	console.log(process.env.TOKEN_SECRET);

}
// try_do();
//   (async () => {
// 	const db = new sqlite3.Database("users");
// 	let sql = `SELECT * FROM example_table`;
// 	try {
// 		const products = await fetchAll(db, sql);
// 		console.log(products);
// 	} catch (err) {
// 		console.log(err);
// 	} finally {
// 		db.close();
// 	}
// })();

const Fastify = fastify({logger: true});

interface SignInBody {
	name: string,
	email: string,
	password: string
}

interface LoginBody {
	email: string,
	password: string
}

Fastify.register(async function (fastify) {
	await initDB();
	Fastify.get('/', (request, reply) => {
		console.log("request was received in backend");
		// console.log("User ", userName, " has status ", users.getUserStatus(userName));
		reply.code(200).send({ message: "you're connected to backend service" });
	})
	Fastify.post<{ Body: SignInBody }>('/signup', async (request, reply) => {
		console.log("auth: signup request ", request.body);
		try {
			const hashedPassword = await bcrypt.hash(request.body.password, 10);
			const { name, email } = request.body;

			const user = await createUser(name, email, hashedPassword);
			reply.status(user.status).send(user);
		} catch (e) {
			reply.send({ message: "Error", details: e });
		}
	})

	Fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
		try {
			const user = await getUserByEmail(request.body.email);
			console.log("auth Login: user:", user)
			if (user) {
				const user_ = user as UserDTO;
				const match = await bcrypt.compare(request.body.password, user_.password);
				console.log("auth Login: match:", match)

				if (!match)
					return reply.status(401).send({ error: 'Invalid credentials' });
				const token = jwt.sign({ userId: user_.id }, process.env.TOKEN_SECRET || "", { expiresIn: '1h' });
				reply.send({ token });
			}
			return reply.status(401).send({ error: 'Invalid credentials' });
		} catch (e) {
			reply.status(500).send({ error: "Server error" });
		}
	})
	Fastify.get('/user', async(request, reply) => {
		const token = request.headers.authorization;

		console.log("Auth /user: ")

		if (!token) return reply.status(401).send({ error: 'Access denied' });
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const user = await getUserById(decoded.userId);
			reply.send({user});
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
