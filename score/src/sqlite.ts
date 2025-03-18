import sqlite3 from "sqlite3";
import { execute, fetchAll, fetchFirst } from "./sql";

export const DB_PATH ="/db/scores.db";
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
			`CREATE TABLE IF NOT EXISTS scores (
			id INTEGER PRIMARY KEY,
			data INTEGER NOT NULL,
			first_user_id INTEGER NOT NULL,
			second_user_id INTEGER NOT NULL,
			first_user_name TEXT NOT NULL,
			second_user_name TEXT NOT NULL,
			first_user_score INTEGER NOT NULL,
			second_user_score INTEGER NOT NULL,
			game_mode TEXT NOT NULL)`
		);
	} catch (error) {
		console.log(error);
	} finally {
		db.close();
	}
}

export const createNewScoreRecord = async (
		first_user_id: string,
		second_user_id: string,
		first_user_name: string,
		second_user_name: string,
		score: number[],
		game_mode: string
	) => {
	const db = new sqlite3.Database(DB_PATH);
	const data = Date.now();
	const sql = `INSERT INTO scores(data, first_user_id, second_user_id, first_user_name, second_user_name, first_user_score, second_user_score, game_mode) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
	try {
	  await execute(db, sql, [data.toString(), first_user_id, second_user_id, first_user_name, second_user_name, score[0].toString(), score[1].toString(), game_mode]);
	} catch (err) {
		console.log(err);
	} finally {
	  db.close();
	}
};

export const getAllUserScores = async (id:number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM scores WHERE first_user_id = ? OR second_user_id = ?`;
	try {
	  const scores = await fetchAll(db, sql, [id.toString(), id.toString()]);
	  return ({scores: scores});
	} catch (err) {
		console.log(err);
		return ({error: "Profile not found"});
	} finally {
	  db.close();
	}
}
