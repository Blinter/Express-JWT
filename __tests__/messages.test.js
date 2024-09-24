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

describe("Test Message class", function () {

  beforeEach(async function () {
    await db.query('TRUNCATE TABLE messages RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
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

  test("can create", async function () {
    let m = await Message.create({
      db,
      from_username: "test1",
      to_username: "test2",
      body: "new"
    });

    expect(m).toEqual({
      id: expect.any(Number),
      from_username: "test1",
      to_username: "test2",
      body: "new",
      sent_at: expect.any(Date),
    });
  });

  test("can mark read", async function () {
    let m = await Message.create({
      db,
      from_username: "test1",
      to_username: "test2",
      body: "new"
    });
    expect(m.read_at).toBe(undefined);

    Message.markRead(db, m.id);
    const result = await db.query("SELECT read_at from messages where id=$1",
      [m.id]);
    expect(result.rows[0].read_at).toEqual(expect.any(Date));
  });

  test("can get", async function () {
    let u = await Message.get(db, 1);
    expect(u).toEqual({
      id: expect.any(Number),
      body: "u1-to-u2",
      sent_at: expect.any(Date),
      read_at: null,
      from_user: {
        username: "test1",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000",
      },
      to_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      },
    });
  });
});
