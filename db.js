/** Database connection for messagely. */
const { Pool } = require("pg");
const { DB_URI } = require("./config");

let db;
async function initializeDatabase() {
    try {
        if (!db)
            db = new Pool( { connectionString: DB_URI });
        await db.connect().then(() => {
            console.log(`Connected`);
        }).catch((err) => {
            console.error('Error connecting to database:', err);
            throw err;
        });
        return db;
    } catch (error) {
        console.log(error);
        console.error("Error during database initialization:", error.message);
        throw error;
    }
}


module.exports = { initializeDatabase };
