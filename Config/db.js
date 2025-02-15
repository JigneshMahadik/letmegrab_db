const mysql = require("mysql2");

const db = mysql.createPool({
    host: "sql12.freesqldatabase.com",
    user: "sql12762893",
    password: "SWCzEZxsYm",
    database: "sql12762893",
    connectionLimit: 10,
});

db.getConnection((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

module.exports = db;
