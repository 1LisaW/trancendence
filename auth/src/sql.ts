import sqlite3 from "sqlite3";

type SQLiteDb = sqlite3.Database;
type Resolve = (value?: any)=>void;


// export const execute = async (db: SQLiteDb, sql: string) => {
// 	return new Promise((resolve: Resolve, reject) => {
// 	  db.exec(sql, (err) => {
// 		if (err) reject(err);
// 		resolve();
// 	  });
// 	});
// };
export const execute = async (db:SQLiteDb, sql:string, params?:string[]) => {
	if (params && params.length > 0) {
	  return new Promise((resolve:Resolve, reject) => {
		db.run(sql, params, (err) => {
		  if (err) reject(err);
		  resolve();
		});
	  });
	}
	return new Promise((resolve:Resolve, reject) => {
	  db.exec(sql, (err) => {
		if (err) reject(err);
		resolve();
	  });
	});
  };


export const fetchAll = async (db: SQLiteDb, sql: string, params?) => {
return new Promise((resolve, reject) => {
	db.all(sql, params, (err, rows) => {
	if (err) reject(err);
	resolve(rows);
	});
});
};

export const fetchFirst = async (db:SQLiteDb, sql: string, params) => {
return new Promise((resolve, reject) => {
	db.get(sql, params, (err, row) => {
	if (err) reject(err);
	resolve(row);
	});
});
};
