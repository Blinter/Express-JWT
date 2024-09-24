/** Express app for message.ly. */
const express = require("express");
const cors = require("cors");
const { authenticateJWT } = require("./middleware/auth.js");
const { initializeDatabase } = require("./db");
const ExpressError = require("./expressError");

/** routes */

const setupAuthRoutes = require("./routes/auth");
const setupUserRoutes = require("./routes/users");
const setupMessageRoutes = require("./routes/messages");

async function setupApp() {
  const app = express();

  // allow both form-encoded and json body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // allow connections to all routes from any browser
  app.use(cors());

  // get auth token for all routes
  app.use(authenticateJWT);
  try {
    const db = await initializeDatabase();
    const authRoutes = await setupAuthRoutes(db);
    app.use("/auth", authRoutes);
    const userRoutes = await setupUserRoutes(db);
    app.use('/users', userRoutes);
    const messageRoutes = await setupMessageRoutes(db);
    app.use('/messages', messageRoutes);

  } catch (error) {
    console.error("Error setting up routes:", error.message);
    throw error;
  }

  /** 404 handler */

  app.use(function (req, res, next) {
    const err = new ExpressError("Not Found", 404);
    return next(err);
  });

  /** general error handler */

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    if (process.env.NODE_ENV != "test") console.error(err.stack);

    return res.json({
      error: err,
      message: err.message
    });
  });

  return app;
}

module.exports = setupApp;
