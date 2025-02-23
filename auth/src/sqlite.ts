import sqlite3 from "sqlite3";
import { execute, fetchFirst } from "./sql";

export const DB_PATH ="/db/users.db";
export interface UserDTO {
	id: number,
	name: string,
	email: string,
	password: string;
}

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
			password TEXT NOT NULL)`
		);
	} catch (error) {
		console.log(error);
	} finally {
		db.close();
	}
}

export const createNewUser = async (name:string, email:string, password: string) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `INSERT INTO users(name, email, password) VALUES(?, ?, ?)`;
	try {
	  await execute(db, sql, [name, email, password]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
};

export const getUserByName = async (name:string) => {
	const db = new sqlite3.Database(DB_PATH);

	let sql = `SELECT * FROM users WHERE name = ?`;

	try {
	  const user = await fetchFirst(db, sql, [name]);
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
	  const user = await fetchFirst(db, sql, [email]);
	  console.log(email);
	  return (user);
	} catch (err) {
	  console.log(err);
	} finally {
	  db.close();
	}
}

interface CreateUserDTO {
	err?: {
		field: string | undefined,
		message: string,
		err_code: string
	},
	message?: string,
	status: number
}

export const createUser = async (name:string, email:string, password: string): Promise<CreateUserDTO> => {
	const db = new sqlite3.Database(DB_PATH);
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
	collision = await getUserByEmail(email);
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
	const sql = `INSERT INTO users(name, email, password) VALUES(?, ?, ?)`;
	try {
	  await execute(db, sql, [name, email, password]);
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
