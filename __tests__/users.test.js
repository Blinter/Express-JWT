process.env.NODE_ENV = "test";
const { initializeDatabase } = require('../db');
const setupApp = require("../app");
const net = require('net');
const User = require("../models/user");
const Message = require("../models/message");

let db;
let app;

function getAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      server.close();
      if (err.code === 'EADDRINUSE') {
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      const port = server.address().port;
      server.close();
      resolve(port);
    });

    server.listen(startPort);
  });
}

(async () => {
  try {
    app = await setupApp();
    const newPort = await getAvailablePort();
    app.listen(newPort, function () {
      console.log("Listening on", newPort);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();

beforeAll(async () => {
  console.log('Starting database initialization...');
  try {
    db = await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}, 1000);

afterEach(async () => {
  // console.log('Cleaning up database...');
  try {
    await db.query('TRUNCATE TABLE messages RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");
    console.log('Database cleaned up successfully.');
  } catch (error) {
    // console.error('Failed to clean up database:', error);
  }
});

describe("Test User class", function () {
  beforeEach(async function () {
    await db.query('TRUNCATE TABLE messages RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");
    let u = await User.register({
      db,
      username: "test",
      password: "password",
      first_name: "Test",
      last_name: "Testy",
      phone: "+14155550000",
    });
  });

  afterEach(async () => {
    // console.log('Cleaning up database...');
    try {
      await db.query('TRUNCATE TABLE messages RESTART IDENTITY CASCADE');
      await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
      await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");
      console.log('Database cleaned up successfully.');
    } catch (error) {
      // console.error('Failed to clean up database:', error);
    }
  });

  test("can register", async function () {
    let u = await User.register({
      db,
      username: "joel",
      password: "password",
      first_name: "Joel",
      last_name: "Burton",
      phone: "+14155551212",
    });

    expect(u.username).toBe("joel");
    expect(u.password).not.toBe(undefined);
  });

  test("can authenticate", async function () {
    let isValid = await User.authenticate(db, "test", "password");
    expect(isValid).toBeTruthy();

    isValid = await User.authenticate(db, "test", "xxx");
    expect(isValid).toBeFalsy();
  });


  test("can update login timestamp", async function () {
    await db.query("UPDATE users SET last_login_at=NULL WHERE username='test'");
    let u = await User.get(db, "test");
    console.log(u);
    expect(u.last_login_at).toBe(null);

    await User.updateLoginTimestamp(db, "test");
    let u2 = await User.get(db, "test");
    console.log(u2);
    expect(u2.last_login_at).not.toBe(null);
  });

  test("can get", async function () {
    let u = await User.get(db, "test");
    expect(u).toEqual({
      username: "test",
      first_name: "Test",
      last_name: "Testy",
      phone: "+14155550000",
      last_login_at: expect.any(Date),
      join_at: expect.any(Date),
    });
  });

  test("can get all", async function () {
    let u = await User.all(db);
    expect(u).toEqual([{
      username: "test",
      first_name: "Test",
      last_name: "Testy",
      phone: "+14155550000"
    }]);
  });
});

describe("Test messages part of User class", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

    let u1 = await User.register({
      db,
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let u2 = await User.register({
      db,
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155552222",
    });
    let m1 = await Message.create({
      db,
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2"
    });
    let m2 = await Message.create({
      db,
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1"
    });
  });

  test('can get messages from user', async function () {
    let m = await User.messagesFrom(db, "test1");
    expect(m).toEqual([{
      id: expect.any(Number),
      body: "u1-to-u2",
      sent_at: expect.any(Date),
      read_at: null,
      to_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      }
    }]);
  });

  test('can get messages to user', async function () {
    let m = await User.messagesTo(db, "test1");
    expect(m).toEqual([{
      id: expect.any(Number),
      body: "u2-to-u1",
      sent_at: expect.any(Date),
      read_at: null,
      from_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      }
    }]);
  });
});
