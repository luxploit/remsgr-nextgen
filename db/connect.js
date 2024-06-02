const chalk = require('chalk');
const mysql = require('mysql2');

const db = mysql
.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})
.on('error', (err) => {
    console.error(`${chalk.red.bold('[DB ERROR]')} ${err.message}`);
    process.exit(1);
});

module.exports = db;