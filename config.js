/** Common config for message.ly */

// read .env files and make environmental variables
const dotenv = require("dotenv");
dotenv.config();

const DB_URI = (process.env.NODE_ENV === "test")
  ? "postgresql:///messagely_test"
  : "postgresql:///messagely";

const SECRET_KEY = process.env.SECRET_KEY || "secret12s3";

const JWT_OPTIONS = {};

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  JWT_OPTIONS,
  BCRYPT_WORK_FACTOR,
};