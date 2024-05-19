const path = require('path');
const express = require('express');
const chatapp = require('./chatapp');
const ejs = require('ejs')
const app = express();
const chat = new chatapp();
var loggedInUserID = -1;
const CHATBOTUSERID = 1;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login_page.html');
});

app.get('/logout', (req, res) => {
    loggedInUserID = -1;
    res.redirect('/');
});

app.post('/login', (req, res) => {
    chat.login(req.body.username, req.body.password).then(userid => {
        loggedInUserID = userid;
        if (userid) {
            res.redirect(`/userPage/0`)
        } else {
            res.status(401);
            res.redirect('/?error=1');
        }
    });
});


app.get('/create_user.html', (req, res) => {
    // Serve the HTML file
    res.sendFile(__dirname + '/create_user.html');
});

app.post('/createUser', (req, res) => {
    chat.createUser(req.body.username, req.body.email, req.body.password);
    res.redirect('/');
});

app.get('/userPage/:conversationID', (req, res) => {
    try {
        // authenticate user:
        if (loggedInUserID < 0) {
            res.redirect('/?invalidRequest');
            return;
        }

        var conversationID = req.params.conversationID;
        chat.getConversationID(CHATBOTUSERID, loggedInUserID).then(convos => {
            console.log("getconvos, convoID", convos[0].ConversationID);
            if (conversationID == 0) {
                conversationID = convos[0].ConversationID;
            }
            // Fetch messages for the authenticated user from the database
            chat.getAllConversationsForUser(loggedInUserID).then(conversations => {
                console.log('conversations: ', loggedInUserID, conversations)
                // const allConvos = JSON.parse(JSON.stringify(conversations));
                chat.getAllOtherUsers(loggedInUserID).then(otherUsers => {
                    console.log(loggedInUserID);
                    chat.getAllMessagesInConversation(conversationID).then(messages => {
                        ejs.renderFile(__dirname + '/user_page.ejs',
                            {
                                convos: conversations,
                                users: otherUsers,
                                messages: messages,
                                partner: { username: 'Username', icon: 'pic' },
                                conversationID: conversationID,
                                userID: loggedInUserID
                            }, (err, html) => {
                                if (err) {
                                    console.error('Error rendering template:', err);
                                    res.status(500).send('Internal Server Error');
                                } else {
                                    res.send(html);
                                }
                            });
                    });
                });
            });
        });
        } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Internal Server Error');
    }
});

function getConversations(conversationID) {

}

app.get('/conversation/:conversationId', (req, res) => {
    const conversationID = req.params.conversationId;
    // Fetch conversation data based on conversationId
    // Render a page with the full conversation data
    //res.send(`Display full conversation for conversation ID: ${conversationId}`);
    try {
        chat.getAllMessagesInConversation(conversationID).then(messages => {
            // let allMessages = JSON.parse(JSON.stringify(messages));
            ejs.renderFile(__dirname + '/conversation_page.ejs', { messages: messages, partner: { username: 'Ivan', icon: 'xx' }, conversationID: conversationID }, (err, html) => {
                if (err) {
                    console.error('Error rendering template:', err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.send(html);
                }
            });
        })
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Internal Server Error');
    }


});

app.post('/addConvo/:partnerID', (req, res) => {
    console.log("add conco");
    const partnerUserID = req.body.partnerID;
    console.log("req params", req.params);
    console.log("req body", req.body);
    chat.getConversationID(loggedInUserID, partnerUserID).then(convoID => {
        console.log("convoID", convoID);
        if (convoID.length > 0) {
            console.log("in add convo");
            chat.getAllConversationsForUser(loggedInUserID).then(conversations => {
                res.redirect(`/userPage/${convoID[0].ConversationID}`);
            });
        } else {
            chat.addConversation(loggedInUserID, partnerUserID).then((conversationID) => {
                console.log("addconvo convoID: ", conversationID);
                res.redirect(`/userPage/${conversationID}`);
            });
        }
    })
})

app.get('/deleteConvo/:conversationID', (req, res) => {
    console.log("delete convo:", req.params.conversationID);
    const conversationID = req.params.conversationID;
    chat.deleteConversation(conversationID).then(() => {
        chat.getAllConversationsForUser(loggedInUserID).then(conversations => {
            console.log("going to redirect");
            res.redirect(`/userPage/0`);
        })
    });
})

app.post('/sendMessage/:conversationID', (req, res) => {
    chat.addMessage(req.params.conversationID, loggedInUserID, req.body.Content).then(messageid => {
        if (messageid) {
            res.redirect(`/userPage/${req.params.conversationID}`)
        } else {
            console.error('Error fetching messages:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.listen(3000);
