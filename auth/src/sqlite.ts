import sqlite3 from "sqlite3";
import { execute, fetchAll, fetchFirst } from "./sql";
import { AUTH_UserDTO, AUTH_CreateUserDTO, AUTH_ProfileDTO, AUTH_ProfileResponse } from "./model";

export const DB_PATH ="/db/users.db";

export const initDB = async () => {
	// create db "users" if it didn't exist
	const db = new sqlite3.Database(DB_PATH);
	try {
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			email TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			google_id TEXT UNIQUE
			is_deleted INTEGER NOT NULL DEFAULT 0)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS profiles (
			id INTEGER PRIMARY KEY,
			user_id INTEGER NOT NULL UNIQUE,
			avatar TEXT,
			phone TEXT)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS profiles (
			id INTEGER PRIMARY KEY,
			user_id INTEGER NOT NULL UNIQUE,
			avatar TEXT,
			phone TEXT)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS friends (
			id INTEGER PRIMARY KEY,
			user_id INTEGER NOT NULL,
			friend_id INTEGER NOT NULL)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS blocks (
			id INTEGER PRIMARY KEY,
			user_id INTEGER NOT NULL,
			blocked_id INTEGER NOT NULL)`
		);
	} catch (error) {
		console.log(error);
	} finally {
		db.close();
	}
}

export const createNewUser = async (name:string, email:string, password: string) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql_users = `INSERT INTO users(name, email, password) VALUES(?, ?, ?)`;
	const sql_profiles = `INSERT INTO profiles(user_id) VALUES(?)`;
	try {
	  await execute(db, sql_users, [name, email, password]);
	  const user = await fetchFirst(db, `SELECT * FROM users WHERE name = ?`, [name]) as AUTH_UserDTO;
	  await execute(db, sql_profiles, [user.id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
};

export const addUsersFriends = async (user_id: number, friend_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql_friends = `INSERT INTO friends(user_id, friend_id) VALUES(?, ?)`;
	try {
	  await execute(db, sql_friends, [user_id.toString(), friend_id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
}

export const getUsersFriends = async (user_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql_friends = `SELECT friends.friend_id, users.name
	FROM friends
	LEFT JOIN users ON friends.friend_id = users.id
	WHERE user_id = ?`;
	try {
	  const friends = await fetchAll(db, sql_friends, [user_id.toString()]) as number[] ;
	  return ({friends});

	//   await execute(db, sql_friends, [user_id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
}


export const deleteUsersFriends = async (user_id: number, friend_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql_friends = `DELETE FROM friends WHERE user_id = ? AND friend_id = ?)`;
	try {
	  await execute(db, sql_friends, [user_id.toString(), friend_id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
}

export const updateProfile = async (id:number, avatar:string, phone: string) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `UPDATE profiles SET avatar = ?, phone = ? WHERE user_id = ?`;
	try {
	  await execute(db, sql, [avatar, phone, id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
}

export const getProfile = async (id:number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM profiles WHERE user_id = ?`;
	try {
	  const profile = await fetchFirst(db, sql, [id.toString()]) as AUTH_ProfileResponse;
	  console.log("id:", id," getProfile: ", profile);

	  // Simona: Handle case where profile doesn't exist
	  if (!profile) {
		console.log(`Profile not found for user ${id}, creating default profile`);
		// Create a default profile
		await execute(db,
		  "INSERT INTO profiles (user_id, avatar, phone) VALUES (?, ?, ?)",
		  [id.toString(), '', '']
		);

		// Return default profile
		const response: AUTH_ProfileDTO = {
		  profile: {
			  avatar: '',
			  phone: ''
		  }
		};
		return response;
	  }

	  const response: AUTH_ProfileDTO = {
		profile: {
			avatar: profile.avatar,
			phone: profile.phone
		}
	  };
	  return (response);
	} catch (err) {
		console.log(err);
		return ({error: "Profile not found"});
	} finally {
	  db.close();
	}
}

export const getUsersAvatarByName = async (name:string) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql_users = `SELECT * FROM users WHERE name = ?`;
	const sql_profile = `SELECT * FROM profiles WHERE user_id = ?`;
	try {
	  const user = await fetchFirst(db, sql_users, [name]) as AUTH_UserDTO;
	  if (!user)
		return ({error: "User not found"});
	  const id = user.id;
	  const profile = await fetchFirst(db, sql_profile, [id.toString()]) as AUTH_ProfileResponse;
	  if (!profile)
		return ({error: "Profile not found"});
	//   console.log("getUsersAvatarByName profile.avatar:", profile.avatar.substring(0, 10));
	  return ({avatar: profile.avatar});
	} catch (err) {
		console.log(err);
		return ({error: "Profile not found"});
	} finally {
	  db.close();
	}
}

export const getUserByName = async (name:string) => {
	const db = new sqlite3.Database(DB_PATH);

	let sql = `SELECT * FROM users WHERE name = ?`;

	try {
	  const user = await fetchFirst(db, sql, [name]) as AUTH_UserDTO;
	  console.log(name);
	  return (user);
	} catch (err) {
	  console.log(err);
	} finally {
	  db.close();
	}
}

export const getPossibleUserByName = async (name:string) => {
	const db = new sqlite3.Database(DB_PATH);

	let sql = `SELECT * FROM users WHERE name = ?`;

	try {
	  let proposedName = name;
	  let user = await fetchFirst(db, sql, [proposedName]);
	  while (user)
	  {
		proposedName += Math.floor((Math.random() * 100) + 1);
		user = await fetchFirst(db, sql, [proposedName]);
	  }
	  console.log(proposedName);
	  return (proposedName);
	} catch (err) {
	  console.log(err);
	} finally {
	  db.close();
	}
}

export const getUserByEmail = async (email:string) => {
	const db = new sqlite3.Database(DB_PATH);

	let sql = `SELECT * FROM users WHERE email = ?`;

	try {
	  const user = await fetchFirst(db, sql, [email]) as AUTH_UserDTO;
	//   const response = {name: user.name, email: user.email};
	//   console.log(email);
	  return (user);
	} catch (err) {
	  console.log(err);
	} finally {
	  db.close();
	}
}



export const createUser = async (name:string, email:string, password: string): Promise<AUTH_CreateUserDTO> => {
	const db = new sqlite3.Database(DB_PATH);
	if (name.length > 20) {
		return ({
			err: {
				field: name,
				err_code: "string-too-long",
				message: `Name could not be longer than 20 symbols`
			},
			status: 400
		})
	}
	let collision = await getUserByName(name);
	if (collision)
	{
		const proposedName = await getPossibleUserByName(name);
		return ({
			err: {
				field: name,
				err_code: "name-not-unique",
				message: `${proposedName}`
			},
			status: 400
		})
	}
	collision = await getUserByEmail(email) as AUTH_UserDTO;
	if (collision)
	{
		return ({
			err: {
				field: undefined,
				err_code: "already-registered",
				message: `User already exists`
			},
			status: 400
	})
	}
	const sql_users = `INSERT INTO users(name, email, password) VALUES(?, ?, ?)`;
	const sql_profiles = `INSERT INTO profiles(user_id) VALUES(?)`;
	try {
	  await execute(db, sql_users, [name, email, password]);
	  const user = await fetchFirst(db, `SELECT * FROM users WHERE name = ?`, [name]) as AUTH_UserDTO;
	  await execute(db, sql_profiles, [user.id.toString()]);
	  return ({
		message: "User registered successfully",
		status: 201
	  })
	} catch (err) {
		console.log(err);
		return ({
			err: {
				field: undefined,
				err_code: "server-error",
				message: `Server error`
			},
			status: 500
		})
	} finally {
	  db.close();
	}
};

export const getUserByEmailAndPassword = async (email:string, password: string) => {
	const db = new sqlite3.Database(DB_PATH);
	let sql = `SELECT * FROM users WHERE email = ? and password = ?`;

	try {
	  const user = await fetchFirst(db, sql, [email, password]);
	  if (!user)
	  {
	    return ({err: {
			field: undefined,
			err_code: "login-and-password-nor-match",
			message: `Login and password does not match.`
		}})
	  }
	//   console.log(user);
	  return (user);
	} catch (err) {
	  console.log(err);
	} finally {
	  db.close();
	}
};

export const getUserById = async (id:number) => {
	const db = new sqlite3.Database(DB_PATH);
	let sql = `SELECT * FROM users WHERE id = ?`;

	try {
	  const user = await fetchFirst(db, sql, [id]) as AUTH_UserDTO;
	  return (user);
	} catch (err) {
	  console.log(err);
	  throw err;
	} finally {
	  db.close();
	}
};

export const deleteUser = async (id:number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql_users = `UPDATE users SET is_deleted = 1, password = ? WHERE id = ?`;
	const sql_profiles = `UPDATE profiles SET avatar = ?, phone = ? WHERE user_id = ?`;
	const sql_friends = `DELETE FROM friends WHERE user_id = ? OR friend_id = ?`;

	try {
	  await execute(db, sql_profiles, ["", id.toString()]);
	  await execute(db, sql_users, ["", "", id.toString()]);
	  await execute(db, sql_friends, [id.toString(), id.toString()]);
	  return ({message: "User deleted successfully"});
	} catch (err) {
	  console.log(err);
	  return ({error: "User not found"});
	} finally {
	  db.close();
	}
}
