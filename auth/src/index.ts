import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import fastify from "fastify";
import { createUser, getUserByEmail, getUserByEmailAndPassword, initDB, getUserById, updateProfile, getProfile, deleteUser, getUsersAvatarByName, addUsersFriends, getUsersFriends, deleteUsersFriends, getUsersBlocked, addUsersBlocked } from "./sqlite";
import { AUTH_UserDTO, AUTH_AvatarRequestParams, AUTH_LoginRequestBody, AUTH_ProfileUpdateRequestBody, AUTH_SignInRequestBody, AUTH_CreateUserDTO, AUTH_LoginDTO, AUTH_ProfileUpdateResponse, AUTH_ServerErrorDTO, AUTH_UserDeleteDTO, AUTH_AuthErrorDTO, AUTH_ProfileDTO, AUTH_AvatarDTO, AUTH_IsAuthResponse, AUTH_GetUserDTO, AUTH_FriendsRequestBody, AUTH_BlocksRequestBody } from "./model";
import { handleGoogleAuth } from "./google-auth"; // Simona - Google Auth
import { GoogleAuthRequestBody, GoogleAuthResponse } from "./google-models"; // Simona - Google Models
import { initGoogleAuthDB, createUserWithGoogle, getUserByName } from "./google-sqlite"; // Simona - Google SQLite

dotenv.config();

const PORT = 8083;

const Fastify = fastify({logger: true});

Fastify.register(async function (fastify) {
	await initDB();
	await initGoogleAuthDB(); // Simona - Initialize Google Auth DB

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

	Fastify.get('/friends', async(request, reply) => {
		const token = request.headers.authorization || '';

		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const friends = await getUsersFriends(decoded.userId);
			reply.send(friends);
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}

	})

	Fastify.post<{Body: AUTH_FriendsRequestBody}>('/friends', async(request, reply) => {
		const token = request.headers.authorization || '';

		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const friends = await getUsersFriends(decoded.userId);

			let friends_ids = (await Promise.all(
				request.body.friends.map(async (name) => {
					const data = await getUserByName(name);
					// if (data)
					return data?.id;
				})
			)).filter(id => id != undefined);


			if (friends?.friends)
				friends_ids = friends_ids.filter(id => !friends?.friends.includes(id));

			friends_ids.forEach(id => addUsersFriends(decoded.userId, id));

			// updateProfile(user.id, request.body.avatar || '', request.body.phone || '');

			reply.send({message: "Friends updated"});
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.post<{Body: AUTH_FriendsRequestBody}>('/unfriends', async(request, reply) => {
		const token = request.headers.authorization || '';

		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const friends = await getUsersFriends(decoded.userId);

			let friends_ids = (await Promise.all(
				request.body.friends.map(async (name) => {
					const data = await getUserByName(name);
					// if (data)
					return data?.id;
				})
			)).filter(id => id != undefined);


			if (friends?.friends)
				friends_ids = friends_ids.filter(id => friends?.friends.includes(id));

			friends_ids.forEach(id => deleteUsersFriends(decoded.userId, id));

			// updateProfile(user.id, request.body.avatar || '', request.body.phone || '');

			reply.send({message: "Friends updated"});
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}
	})

	Fastify.get<{Params:{user_id: number}}>('/blocks/:user_id', async(request, reply) => {
		// const token = request.headers.authorization || '';
		const {user_id} = request.params;

		try {
			// const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const blocked = await getUsersBlocked(user_id);
			reply.send(blocked);
		} catch (e) {
			reply.status(500).send({ error: "Server error", details: e });
		}

	})

	Fastify.post<{Body: AUTH_BlocksRequestBody}>('/blocks', async(request, reply) => {
		const token = request.headers.authorization || '';

		try {
			const decoded = jwt.verify(token, process.env.TOKEN_SECRET || "") as JwtPayload;

			const blocked = await getUsersBlocked(decoded.userId);

			let blocked_ids = (await Promise.all(
				request.body.blocks.map(async (name) => {
					const data = await getUserByName(name);
					// if (data)
					return data?.id;
				})
			)).filter(id => id != undefined);


			if (blocked?.blocks)
				blocked_ids = blocked_ids.filter(id => !blocked?.blocks.includes(id));

			blocked_ids.forEach(id => addUsersBlocked(decoded.userId, id));

			// updateProfile(user.id, request.body.avatar || '', request.body.phone || '');

			reply.send({message: "Blocked updated"});
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

	// Simona - Google Auth
	Fastify.post<{ Body: GoogleAuthRequestBody, Reply: GoogleAuthResponse }>('/google-auth', async (request, reply) => {
		try {
			const response = await handleGoogleAuth(request.body);

			if (response.error) {
				return reply.status(400).send(response);
			}

			return reply.send(response);
		} catch (error) {
			console.error('Google auth route error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	});

	Fastify.post<{ Body: { username: string, email: string, googleId: string }, Reply: GoogleAuthResponse }>('/google-complete', async (request, reply) => {
		try {
			const { username, email, googleId } = request.body;

			console.log('Google complete request:', { username, email, googleId });

			// Validate username
			if (!username || username.length < 3) {
				return reply.status(400).send({ error: 'Username must be at least 3 characters' });
			}

			// Check if username is available
			const existingUser = await getUserByName(username);
			if (existingUser) {
				return reply.status(400).send({ error: 'Username already taken' });
			}

			// Create user with Google data
			const user = await createUserWithGoogle(googleId, username, email);

			console.log('User created:', user);

			if (!user) {
				return reply.status(500).send({ error: 'Failed to create user' });
			}

			// Generate JWT token
			const token = jwt.sign(
				{ userId: user.id },
				process.env.TOKEN_SECRET || "",
				{ expiresIn: '1h' }
			);

			const response = {
				token,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					avatar: user.avatar
				}
			};

			console.log('Sending response:', response);
			return reply.send(response);

		} catch (error) {
			console.error('Google complete error:', error);
			return reply.status(500).send({ error: 'Internal server error' });
		}
	});
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
