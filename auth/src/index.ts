import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import fastify from "fastify";
import { createUser, getUserByEmail, getUserByEmailAndPassword, getUserByName, initDB, getUserById, updateProfile, getProfile, deleteUser, getUsersAvatarByName } from "./sqlite";
import { AUTH_UserDTO, AUTH_AvatarRequestParams, AUTH_LoginRequestBody, AUTH_ProfileUpdateRequestBody, AUTH_SignInRequestBody, AUTH_CreateUserDTO, AUTH_LoginDTO, AUTH_ProfileUpdateResponse, AUTH_ServerErrorDTO, AUTH_UserDeleteDTO, AUTH_AuthErrorDTO, AUTH_ProfileDTO, AUTH_AvatarDTO, AUTH_IsAuthResponse, AUTH_GetUserDTO } from "./model";

dotenv.config();

const PORT = 8083;

const Fastify = fastify({logger: true});

Fastify.register(async function (fastify) {
	await initDB();

	Fastify.get<{Reply: AUTH_IsAuthResponse}>('/is-auth', async (request, reply) => {
		const token = request.headers.authorization;
		if (!token) return reply.status(401).send({ error: 'Invalid credentials' });
		jwt.verify(token, process.env.TOKEN_SECRET || "", (err, decoded) => {
			if (err)
				return reply.status(401).send({ error: 'Invalid credentials' });
			const userId: number = (decoded as JwtPayload).userId;
			reply.send({ userId });
		});
	});

	Fastify.post<{ Body: AUTH_SignInRequestBody, Reply: AUTH_CreateUserDTO }>('/signup', async (request, reply) => {
		try {
			const hashedPassword = await bcrypt.hash(request.body.password, 10);
			const { name, email } = request.body;

			const user = await createUser(name, email, hashedPassword);
			reply.status(user.status).send(user);
		} catch (e) {
			reply.send({
				status: 500,
				err: {
				field: undefined,
				message: 'Server error',
				err_code: 'server-error'
			}});
		}
	})

	Fastify.post<{ Body: AUTH_LoginRequestBody, Reply: AUTH_LoginDTO | AUTH_ServerErrorDTO }>('/login', async (request, reply) => {
		try {
			const user = await getUserByEmail(request.body.email);
			console.log("auth Login: user:", user)
			if (user) {
				const user_ = user as AUTH_UserDTO;
				const match = await bcrypt.compare(request.body.password, user_.password);

				if (!match)
					return reply.status(401).send({ error: 'Invalid credentials' });
				const token = jwt.sign({ userId: user_.id }, process.env.TOKEN_SECRET || "", { expiresIn: '1h' });
				return reply.send({ token });
			}
			return reply.status(401).send({ error: 'Invalid credentials' });
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Reply: AUTH_GetUserDTO | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO}>('/user', async(request, reply) => {
		const token = request.headers.authorization;

		if (!token) return reply.status(401).send({ error: 'Access denied' });
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const response = await getUserById(decoded.userId);
			const user = {id: response.id, name: response.name, email: response.email};
			reply.send({user});
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.post<{Body: AUTH_ProfileUpdateRequestBody, Reply: AUTH_ProfileUpdateResponse | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO}>('/profile', async(request, reply) => {
		const token = request.headers.authorization || '';

		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const user = await getUserById(decoded.userId);
			updateProfile(user.id, request.body.avatar || '', request.body.phone || '');

			reply.send({message: "Profile updated"});
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Reply: AUTH_ProfileDTO | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO}>('/profile', async(request, reply) => {
		const token = request.headers.authorization || '';

		console.log("Auth /profile: ")
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			console.log("decoded.userId: ", decoded.userId);
			const response = await getProfile(decoded.userId);

			reply.send(response);
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Params: AUTH_AvatarRequestParams, Reply: AUTH_AvatarDTO | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO}>('/avatar/:name', async(request, reply) => {
		const name = request.params.name;
		try {
			const response = await getUsersAvatarByName(name);
			reply.send(response);
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.delete<{Reply: AUTH_UserDeleteDTO | AUTH_AuthErrorDTO | AUTH_ServerErrorDTO}>('/profile', async(request, reply) => {
		const token = request.headers.authorization;

		if (!token) return reply.status(401).send({ error: 'Access denied' });
		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const user = await getUserById(decoded.userId);
			const response = await deleteUser(user.id);

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
