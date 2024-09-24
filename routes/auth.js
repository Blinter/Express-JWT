const express = require('express');
const ExpressError = require("../expressError");
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const { SECRET_KEY, JWT_OPTIONS } = require("../config");
const router = express.Router();
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
async function setupAuthRoutes(db) {
    router.post('/login', async function (req, res, next) {
        try {
            const { username, password } = req.body;

            if (username == null ||
                typeof username !== 'string' ||
                username.length === 0)
                return next(new ExpressError("Username must have an input.", 400));
            if (username.length > 2048)
                return next(new ExpressError("Username has a max length of 2048.", 400));

            if (password == null ||
                typeof password !== 'string' ||
                password.length === 0)
                return next(new ExpressError("Password must have an input.", 400));
            if (password.length > 2048)
                return next(new ExpressError("Password has a max length of 2048.", 400));

            let authenticated;
            try {
                authenticated = await User.authenticate(db, username, password);
            } catch (err) {
                return next(new ExpressError(err));
            }
            if (!authenticated) {
                return next(new ExpressError("Invalid username/password!", 400));
            }

            try {
                await User.updateLoginTimestamp(db, username);
            } catch (err) {
                return next(new ExpressError(err));
            }
            const payload = { username };
            console.log("Payload for JWT:", payload);
            console.log("Using SECRET_KEY:", SECRET_KEY);
            let token = jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
            console.log("Generated token:", token);

            return res.json({ token });

        } catch (err) {
            return next(new ExpressError(err));
        }
    });

    /** POST /register - register user: registers, logs in, and returns token.
     *
     * {username, password, first_name, last_name, phone} => {token}.
     *
     *  Make sure to update their last-login!
     */

    router.post('/register', async function (req, res, next) {
        try {
            console.log("Called register");
            const { username, password, first_name, last_name, phone } = req.body;
            if (username == null ||
                typeof username !== 'string' ||
                username.length === 0)
                return next(new ExpressError("Username must have an input.", 400));
            if (username.length > 2048)
                return next(new ExpressError("Username has a max length of 2048.", 400));

            if (password == null ||
                typeof password !== 'string' ||
                password.length === 0)
                return next(new ExpressError("Password must have an input.", 400));
            if (password.length > 2048)
                return next(new ExpressError("Password has a max length of 2048.", 400));

            if (first_name == null ||
                typeof first_name !== 'string' ||
                first_name.length === 0)
                return next(new ExpressError("first_name must have an input.", 400));
            if (first_name.length > 2048)
                return next(new ExpressError("first_name has a max length of 2048.", 400));

            if (last_name == null ||
                typeof last_name !== 'string' ||
                last_name.length === 0)
                return next(new ExpressError("last_name must have an input.", 400));
            if (last_name.length > 2048)
                return next(new ExpressError("last_name has a max length of 2048.", 400));

            if (phone == null ||
                typeof phone !== 'string' ||
                phone.length === 0)
                return next(new ExpressError("phone must have an input.", 400));
            if (phone.length > 2048)
                return next(new ExpressError("phone has a max length of 2048.", 400));

            let newUser;
            try {
                newUser = await User.register({ db, username, password, first_name, last_name, phone });
            } catch (err) {
                console.log("Check code");
                console.error(err);
                return next(new ExpressError(err));
            }
            if (!newUser) {
                return next(new ExpressError(`Failed to register user: ${err.message}`, 400));
            }

            try {
                await User.updateLoginTimestamp(db, username);
            } catch (err) {
                return next(new ExpressError(err));
            }
            const payload = { username };
            console.log("Payload for JWT:", payload);
            console.log("Using SECRET_KEY:", SECRET_KEY);
            let token = jwt.sign(payload, SECRET_KEY, JWT_OPTIONS);
            console.log("Generated token:", token);

            return res.json({ token });

        } catch (err) {
            return next(new ExpressError(err));
        }
    });

    return router;
}

module.exports = setupAuthRoutes;
