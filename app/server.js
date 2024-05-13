const path = require('path');
const express = require('express');
const chatapp = require('./chatapp');

const app = express();
const chat = new chatapp();

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

app.post('/login', (req, res) => {
    chat.login(req.body.username, req.body.password).then(userid => {
        res.send({ 'userid': userid });
        res.end();
    });
});

app.post('/sendMessage', (req, res) => {
    chat.addMessage(req.body.conversationID, req.body.senderID, req.body.content).then(messageid => {
        if (messageid) {
            chat.getAllMessagesInConversation(1)
            .then(allMessages => {
                res.send({ 'messages': allMessages });
                res.end();
            });
        } else {
            res.send({ 'messages': 'error' });
            res.end();
        }
    });
});

app.listen(3000);