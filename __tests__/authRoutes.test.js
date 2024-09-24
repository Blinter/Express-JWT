process.env.NODE_ENV = "test";
const request = require('supertest');
const jwt = require('jsonwebtoken');
const net = require('net');
const { initializeDatabase } = require('../db');
const setupApp = require("../app");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");

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

describe("Auth Routes Test", function () {

    beforeEach(async function () {
        await db.query('TRUNCATE TABLE messages RESTART IDENTITY CASCADE');
        await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
        await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

        await User.register({
            db,
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
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

    // //   /** POST /auth/register => token  */

    describe("POST /auth/register", function () {
        test("can register", async function () {
            let response = await request(app)
                .post("/auth/register")
                .send({
                    username: "bob",
                    password: "secret",
                    first_name: "Bob",
                    last_name: "Smith",
                    phone: "+14150000000"
                });

            let token = response.body.token;
            expect(jwt.decode(token)).toEqual({
                username: "bob",
                iat: expect.any(Number)
            });
        });
    });

    //   /** POST /auth/login => token  */

    describe("POST /auth/login", function () {
        test("can login", async function () {
            let response = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "password" });
            let token = response.body.token;
            console.log("Received token in test:", token);

            if (token) {
                console.log("Attempting to decode token with SECRET_KEY:", SECRET_KEY);
                let decoded = jwt.decode(token);
                console.log("Decoded token:", decoded);

                // Also try to verify the token
                try {
                    let verified = jwt.verify(token, SECRET_KEY);
                    console.log("Verified token:", verified);
                } catch (error) {
                    console.error("Token verification failed:", error.message);
                }

                expect(decoded).toEqual({
                    username: "test1",
                    iat: expect.any(Number)
                });
            } else {
                console.error("No token received in the response");
                expect(true).toEqual(false);
            }
        });

        test("won't login w/wrong password", async function () {
            let response = await request(app)
                .post("/auth/login")
                .send({ username: "test1", password: "WRONG" });
            expect(response.statusCode).toEqual(400);
        });

        test("won't login w/wrong password", async function () {
            let response = await request(app)
                .post("/auth/login")
                .send({ username: "not-user", password: "password" });
            expect(response.statusCode).toEqual(400);
        });
    });
});