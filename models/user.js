/** User class for message.ly */
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({db, username, password, first_name, last_name, phone }) {
    if (!db)
      throw new Error("Database Undefined");
    if (!username)
      throw new Error("Provide a valid username");
    if (!password)
      throw new Error("Provide a valid password");
    if (!first_name)
      throw new Error("Provide a valid first_name");
    if (!last_name)
      throw new Error("Provide a valid last_name");
    if (!phone)
      throw new Error("Provide a valid phone");

    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (
        username, -- $1
        password, -- $2
        first_name, -- $3
        last_name, -- $4
        phone, -- $5
        join_at, -- current_timestamp
        last_login_at) -- current_timestamp
      VALUES 
        ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING 
        username,
        password,
        first_name,
        last_name,
        phone`,
      [username, hashedPassword, first_name, last_name, phone]);

    if (!result.rows) {
      throw new Error(`User already exists: ${username}`);
    }

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(db, username, password) {
    if (!db)
      throw new Error("Database Undefined");
    try {
      const resultUser = await db.query(
        `SELECT
        password
      FROM 
        users
      WHERE
        username = $1`,
        [username]);

      if (!resultUser || !resultUser.rows || resultUser.rows.length === 0) {
        return false;
      }

      const storedPassword = resultUser.rows[0].password;
      if (!storedPassword) {
        return false;
      }

      return await bcrypt.compare(password, storedPassword);
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(db, username) {
    if (!db)
      throw new Error("Database Undefined");
    const result = await db.query(
      `UPDATE
        users
      SET
        last_login_at = current_timestamp
      WHERE
        username = $1
      RETURNING
        last_login_at`,
      [username]
    );

    if (!result.rows[0].last_login_at)
      throw new Error(`Failed to update login timestamp for ${username}`);

    return result.rows[0].last_login_at;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all(db) {
    if (!db)
      throw new Error("Database Undefined");
    const result = await db.query(
      `SELECT
        username,
        first_name,
        last_name,
        phone
      FROM
        users`);

    if (!result.rows.length)
      throw new Error(`No users found`);

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(db, username) {
    if (!db)
      throw new Error("Database Undefined");
    const user = await db.query(
      `SELECT
          username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
        FROM
          users
        WHERE
          username = $1`,
      [username]);

    if (!user || !user.rows || !user.rows.length)
      throw new Error(`No user found`);

    return user.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(db, username) {
    if (!db)
      throw new Error("Database Undefined");
    const userMessages = await db.query(
      `SELECT 
        m.id,
        u.username AS "username",
        u.first_name AS "first_name",
        u.last_name AS "last_name",
        u.phone AS "phone",
        m.body,
        m.sent_at,
        m.read_at
      FROM
        messages AS m
      LEFT JOIN
        users as u
      ON
        m.to_username = u.username
      WHERE
        m.from_username = $1`,
      [username]
    );

    if (!userMessages.rows.length)
      throw new Error(`No messages found`);

    const finalResponse = [];
    for (const message of userMessages.rows)
      finalResponse.push({
        id: message.id,
        to_user: {
          username: message.username,
          first_name: message.first_name,
          last_name: message.last_name,
          phone: message.phone
        },
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at
      });

    return finalResponse;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(db, username) {
    if (!db)
      throw new Error("Database Undefined");
    const userMessages = await db.query(
      `SELECT 
        m.id,
        u.username AS "username",
        u.first_name AS "first_name",
        u.last_name AS "last_name",
        u.phone AS "phone",
        m.body,
        m.sent_at,
        m.read_at
      FROM
        messages AS m
      LEFT JOIN
        users as u
      ON
        m.from_username = u.username
      WHERE
        m.to_username = $1`,
      [username]
    );

    if (!userMessages.rows.length)
      throw new Error(`No messages found`);

    const finalResponse = [];
    for (const message of userMessages.rows)
      finalResponse.push({
        id: message.id,
        from_user: {
          username: message.username,
          first_name: message.first_name,
          last_name: message.last_name,
          phone: message.phone
        },
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at
      });

    return finalResponse;
  }
}


module.exports = User;