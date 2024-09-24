const express = require('express');
const { ensureLoggedIn } = require("../middleware/auth");
const ExpressError = require("../expressError");
const Message = require("../models/message");
const router = express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
async function setupMessageRoutes(db) {
    router.get('/:id', ensureLoggedIn, async function (req, res, next) {
        if (Object.keys(req.body).length !== 0)
            return next(new ExpressError("Extra data not allowed in this endpoint.", 400));
        if (Object.keys(req.params).length === 0)
            return next(new ExpressError("Request must have a parameter like: /<ID>", 400));

        const selectedMessageId = req.params.id;
        if (selectedMessageId == null ||
            typeof selectedMessageId !== 'string' ||
            selectedMessageId.length === 0)
            return next(new ExpressError("Message ID must have an input like /<ID>/read", 400));
        if (isNaN(selectedMessageId) ||
            !isFinite(selectedMessageId))
            return next(new ExpressError("Message ID must be a number.", 400));

        let retrievedMessage;
        try {
            retrievedMessage = await Message.get(db, selectedMessageId);
        } catch (err) {
            return next(new ExpressError(err));
        }

        if (!retrievedMessage)
            return next(new ExpressError("Message not found!", 404));

        // Check if the message has any relations to the current user.
        if (retrievedMessage.from_user.username !== req.user.username &&
            retrievedMessage.to_user.username !== req.user.username) {
            return next(new ExpressError(
                "You must be the recipient or sender to view this message!", 400));
        }

        return res.json(retrievedMessage);
    });

    /** POST / - post message.
     *
     * {to_username, body} =>
     *   {message: {id, from_username, to_username, body, sent_at}}
     *
     **/
    router.post('', ensureLoggedIn, async function (req, res, next) {
        if (Object.keys(req.body).length === 0)
            return next(new ExpressError("Body is required for this endpoint.", 400));

        const messageToUsername = req.body.to_username;
        if (messageToUsername == null ||
            typeof messageToUsername !== 'string' ||
            messageToUsername.length === 0)
            return next(new ExpressError("To Username must have an input.", 400));
        if (messageToUsername.length > 2048)
            return next(new ExpressError("To Username has a max length of 2048.", 400));

        const messageBody = req.body.body;
        if (messageBody == null ||
            typeof messageBody !== 'string' ||
            messageBody.length === 0)
            return next(new ExpressError("Message Body must have an input.", 400));
        if (messageBody.length > 2048)
            return next(new ExpressError("Message Body has a max length of 2048.", 400));

        //check that user exists
        try {
            const selectedRecipient = await User.get(messageToUsername);
            if (!selectedRecipient)
                return next(new ExpressError("Recipient user not found.", 404));
        } catch (err) {
            console.error(err);
            return next(new ExpressError(err, 404));
        }

        let newMessage;
        //get from_username
        try {
            newMessage = await Message.create({
                db,
                from_username: req.user.username,
                to_username: messageToUsername,
                body: messageBody
            });
        } catch (err) {
            return next(new ExpressError(err));
        }
        if (!newMessage)
            return next(new ExpressError("Message not created!", 404))

        return res.json(newMessage);
    });

    /** POST/:id/read - mark message as read:
     *
     *  => {message: {id, read_at}}
     *
     * Make sure that the only the intended recipient can mark as read.
     *
     **/
    router.post('/:id/read', ensureLoggedIn, async function (req, res, next) {
        if (Object.keys(req.params).length === 0)
            return next(new ExpressError("Request must have a parameter like: /<ID>/read", 400));

        const selectedMessageId = req.params.id;
        if (selectedMessageId == null ||
            typeof selectedMessageId !== 'string' ||
            selectedMessageId.length === 0)
            return next(new ExpressError("Message ID must have an input like /<ID>/read", 400));
        if (isNaN(selectedMessageId) ||
            !isFinite(selectedMessageId))
            return next(new ExpressError("Message ID must be a number.", 400));

        let currentMessage;
        try {
            currentMessage = await Message.get(db, selectedMessageId);
        } catch (err) {
            return next(new ExpressError(err));
        }

        if (!currentMessage)
            return next(new ExpressError("Message not found!", 404));

        if (currentMessage.to_user.username !== req.user.username) {
            return next(new ExpressError("Only the recipient can mark this message as read!", 400));
        }

        if (currentMessage.read_at != null) {
            return next(new ExpressError("Message has already been marked as read!", 400));
        }

        let markedMessage;
        try {
            markedMessage = await Message.markRead(db, selectedMessageId);
        } catch (err) {
            return next(new ExpressError(err));
        }
        if (!markedMessage)
            return next(new ExpressError("Message cannot be marked as read!", 404))

        return res.json({ message: markedMessage });
    });

    return router;
}

module.exports = setupMessageRoutes;
