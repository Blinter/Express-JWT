const express = require("express");
const { ensureCorrectUser, ensureLoggedIn } = require('../middleware/auth');
const { ExpressError } = require("../expressError");
const User = require("../models/user");
const router = express.Router();

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

async function setupUserRoutes(db) {
    router.get('', ensureLoggedIn, async function (req, res, next) {
        let allUsers;
        try {
            allUsers = await User.all(db);
        } catch (err) {
            console.log("Check code:");
            console.error(err);
            return next(new ExpressError(err));
        }
        if (!allUsers)
            return next(new ExpressError("Error getting all users.", 500));

        return allUsers;
    });

    /** GET /:username - get detail of users.
     *
     * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
     *
     **/
    router.get('/:username', ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
        if (Object.keys(req.body).length !== 0)
            return next(new ExpressError("Extra data not allowed in this endpoint.", 400));
        if (Object.keys(req.params).length === 0)
            return next(new ExpressError("Request must have a parameter like: /<Username>", 400));
        const searchedUser = req.params.username;
        if (searchedUser == null ||
            typeof searchedUser !== 'string' ||
            searchedUser.length === 0)
            return next(new ExpressError("Username must have an input.", 400));
        if (searchedUser.length > 2048)
            return next(new ExpressError("Username has a max length of 2048.", 400));
        let retrievedUser;
        try {
            retrievedUser = User.get(db, searchedUser);
        } catch (err) {
            return next(new ExpressError(err));
        }
        if (!retrievedUser)
            return next(new ExpressError("User not found!", 404))

        return res.json(retrievedUser);
    });

    /** GET /:username/to - get messages to user
     *
     * => {messages: [{id,
     *                 body,
     *                 sent_at,
     *                 read_at,
     *                 from_user: {username, first_name, last_name, phone}}, ...]}
     *
     **/
    router.get('/:username/to', ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
        if (Object.keys(req.body).length !== 0)
            return next(new ExpressError("Extra data not allowed in this endpoint.", 400));
        if (Object.keys(req.params).length === 0)
            return next(new ExpressError("Request must have a parameter like: /<Username>", 400));
        const searchedUser = req.params.username;
        if (searchedUser == null ||
            typeof searchedUser !== 'string' ||
            searchedUser.length === 0)
            return next(new ExpressError("Username must have an input.", 400));
        if (searchedUser.length > 2048)
            return next(new ExpressError("Username has a max length of 2048.", 400));
        let retrievedUser;
        try {
            retrievedUser = User.messagesTo(db, searchedUser);
        } catch (err) {
            return next(new ExpressError(err));
        }
        if (!retrievedUser)
            return next(new ExpressError("User not found!", 404))

        return res.json(retrievedUser);
    });

    /** GET /:username/from - get messages from user
     *
     * => {messages: [{id,
     *                 body,
     *                 sent_at,
     *                 read_at,
     *                 to_user: {username, first_name, last_name, phone}}, ...]}
     *
     **/
    router.get('/:username/from', ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
        if (Object.keys(req.body).length !== 0)
            return next(new ExpressError("Extra data not allowed in this endpoint.", 400));
        if (Object.keys(req.params).length === 0)
            return next(new ExpressError("Request must have a parameter like: /<Username>", 400));
        const searchedUser = req.params.username;
        if (searchedUser == null ||
            typeof searchedUser !== 'string' ||
            searchedUser.length === 0)
            return next(new ExpressError("Username must have an input.", 400));
        if (searchedUser.length > 2048)
            return next(new ExpressError("Username has a max length of 2048.", 400));
        let retrievedUser;
        try {
            retrievedUser = User.messagesFrom(db, searchedUser);
        } catch (err) {
            return next(new ExpressError(err));
        }
        if (!retrievedUser)
            return next(new ExpressError("User not found!", 404))

        return res.json(retrievedUser);
    });

    return router;
}

module.exports = setupUserRoutes;

