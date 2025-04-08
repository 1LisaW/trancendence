import sqlite3 from "sqlite3";
import { execute, fetchAll, fetchFirst } from "./sql";
import { SCORE_ScoreDTO, SCORE_TournamentDataDTO, SCORE_TournamentDTO, SCORE_TournamentScoreDTO, SCORE_TournamentUserDTO } from "./model";

export const DB_PATH = "/db/scores.db";
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
			date INTEGER NOT NULL,
			first_user_id INTEGER NOT NULL,
			second_user_id INTEGER NOT NULL,
			first_user_name TEXT NOT NULL,
			second_user_name TEXT NOT NULL,
			first_user_score INTEGER NOT NULL,
			second_user_score INTEGER NOT NULL,
			game_mode TEXT NOT NULL)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS tournaments (
			id INTEGER PRIMARY KEY,
			date INTEGER NOT NULL,
			is_finished INTEGER NOT NULL)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS tournaments_users (
			id INTEGER PRIMARY KEY,
			tournament_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			rating INTEGER NOT NULL,
   			FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE ON UPDATE CASCADE)`
		);
		await execute(
			db,
			`CREATE TABLE IF NOT EXISTS tournaments_scores (
			id INTEGER PRIMARY KEY,
			tournament_id INTEGER NOT NULL,
			date INTEGER NOT NULL,
			first_user_id INTEGER NOT NULL,
			second_user_id INTEGER NOT NULL,
			first_user_name TEXT NOT NULL,
			second_user_name TEXT NOT NULL,
			first_user_score INTEGER NOT NULL,
			second_user_score INTEGER NOT NULL,
   			FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE ON UPDATE CASCADE)`
		);
	} catch (error) {
		console.log(error);
	} finally {
		db.close();
	}
}

export const createNewScoreRecord = async (
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	score: number[],
	game_mode: string
) => {
	const db = new sqlite3.Database(DB_PATH);
	const date = Date.now();
	const sql = `INSERT INTO scores(date, first_user_id, second_user_id, first_user_name, second_user_name, first_user_score, second_user_score, game_mode) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
	try {
		await execute(db, sql, [date.toString(), first_user_id.toString(), second_user_id.toString(), first_user_name, second_user_name, score[0].toString(), score[1].toString(), game_mode]);
	} catch (err) {
		console.log(err);
	} finally {
		db.close();
	}
};

export const getAllUserScores = async (id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM scores WHERE first_user_id = ? OR second_user_id = ?`;
	try {
		const scores = await fetchAll(db, sql, [id.toString(), id.toString()]) as SCORE_ScoreDTO[];
		return ({ scores: scores });
	} catch (err) {
		console.log(err);
		return ({ error: "Profile not found" });
	} finally {
		db.close();
	}
}

export const createNewTournamentRecord = async (users: number[]) => {
	const db = new sqlite3.Database(DB_PATH);
	const date = Date.now();
	const sql = `INSERT INTO tournaments(date, is_finished) VALUES(?, ?)`;
	try {
		const tournament_id = await execute(db, sql, [date.toString(), '0']);
		console.log('tournament_id ', tournament_id);
		if (tournament_id) {
			for (let i = 0; i < users.length; i++) {
				await execute(db, `INSERT INTO tournaments_users(tournament_id, user_id, rating) VALUES(?, ?, ?)`, [tournament_id, users[i], 0]);
			}
		}
		return ({ tournament_id: tournament_id, date: date });
	} catch (err) {
		console.log(err);
		return ({ error: 'could not create new tournament' });

	} finally {
		db.close();
	}
}

export const addNewTournamentUser = async (tournament_id: number, user_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	try {
		await execute(db, `INSERT INTO tournaments_users(tournament_id, user_id, rating) VALUES(?, ?, ?)`, [tournament_id.toString(), user_id.toString(), '0']);
		return ({ tournament_id: tournament_id });
	} catch (err) {
		console.log(err);
		return ({ error: 'could not add user to tournament' });
	} finally {
		db.close();
	}
}

export const addTournamentMatch = async (tournament_id: number, first_user_id: number, second_user_id: number, first_user_name: string, second_user_name: string, score: number[]) => {
	const db = new sqlite3.Database(DB_PATH);
	const date = Date.now();
	const sql = `INSERT INTO tournaments_scores(tournament_id, date, first_user_id, second_user_id, first_user_name, second_user_name, first_user_score, second_user_score) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
	try {
		await execute(db, sql, [tournament_id.toString(), date.toString(), first_user_id.toString(), second_user_id.toString(), first_user_name, second_user_name, score[0].toString(), score[1].toString()]);
		await execute(db, `UPDATE tournaments_users SET rating = rating + ? WHERE tournament_id = ? AND user_id = ?`, [score[0].toString(), tournament_id.toString(), first_user_id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
		db.close();
	}
}

export const finishTournament = async (tournament_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	try {
		await execute(db, `UPDATE tournaments SET is_finished = 1 WHERE id = ?`, [tournament_id.toString()]);
	} catch (err) {
		console.log(err);
	} finally {
		db.close();
	}
}

export const getActiveTournament = async () => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM tournaments WHERE is_finished = 0`;
	try {
		const tournament = await fetchFirst(db, sql, [0]) as SCORE_TournamentDTO;
		return ({ tournament: tournament });
	} catch (err) {
		console.log(err);
		return ({ error: 'no active tournaments' });
	} finally {
		db.close();
	}
}

export const getTournamentUsers = async (tournament_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM tournaments_users WHERE tournament_id = ?`;
	try {
		const users = await fetchAll(db, sql, [tournament_id.toString()]) as SCORE_TournamentUserDTO[];
		return ({ users: users });
	} catch (err) {
		console.log(err);
		return ({ error: "Tournaments not found" });
	} finally {
		db.close();
	}
}

export const getTournamentMatches = async (tournament_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM tournaments_scores WHERE tournament_id = ?`;
	try {
		const matches = await fetchAll(db, sql, [tournament_id.toString()]) as SCORE_TournamentScoreDTO[];
		return ({ matches: matches });
	} catch (err) {
		console.log(err);
		return ({ matches: null });
	} finally {
		db.close();
	}
}

export const getTournamentHistory = async (tournament_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM tournaments_users
		LEFT JOIN tournament_scores ON tournaments_users.user_id = tournament_scores.first_user_id OR tournaments_users.user_id = tournament_scores.second_user_id
		LEFT JOIN tournaments ON tournaments_users.tournament_id = tournaments.id
		WHERE tournaments_users.tournament_id = ?)`;

	try {
		const tournamentData = await fetchAll(db, sql, [tournament_id.toString()]) as SCORE_TournamentDataDTO[];
		return ({tournaments: tournamentData});
	} catch (err) {
		console.log(err);
		return ({ error: 'no tournament data' });
	} finally {
		db.close();
	}
}

export const getAllTournamentsHistory = async () => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM tournaments_users
		LEFT JOIN tournament_scores ON tournaments_users.user_id = tournament_scores.first_user_id OR tournaments_users.user_id = tournament_scores.second_user_id
		LEFT JOIN tournaments ON tournaments_users.tournament_id = tournaments.id)`;

	try {
		const tournamentData = await fetchAll(db, sql) as SCORE_TournamentDataDTO[];
		return ({tournaments: tournamentData});
	} catch (err) {
		console.log(err);
		return ({ error: 'no tournaments data' });
	} finally {
		db.close();
	}
}

export const getUsersTournamentHistory = async (user_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT * FROM tournaments_users
		LEFT JOIN tournament_scores ON tournaments_users.user_id = tournament_scores.first_user_id OR tournaments_users.user_id = tournament_scores.second_user_id
		LEFT JOIN tournaments ON tournaments_users.tournament_id = tournaments.id
		WHERE tournaments_users.tournament_id in ( SELECT tournament_id FROM tournaments_users WHERE user_id = ?)`;

	try {
		const tournamentData = await fetchAll(db, sql, [user_id.toString()]) as SCORE_TournamentDataDTO[];
		return ({tournaments: tournamentData});
	} catch (err) {
		console.log(err);
		return ({ error: 'no tournaments data for user' });
	} finally {
		db.close();
	}
}

export const getUserTournaments = async (user_id: number) => {
	const db = new sqlite3.Database(DB_PATH);
	const sql = `SELECT tournament_id FROM tournaments_users WHERE user_id = ?`;
	try {
		const tournaments = await fetchAll(db, sql, [user_id.toString()]) as SCORE_TournamentDTO[];
		return ({ tournaments: tournaments });
	} catch (err) {
		console.log(err);
		return ({ tournaments: null });
	} finally {
		db.close();
	}
}
