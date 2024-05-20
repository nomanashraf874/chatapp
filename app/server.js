const path = require('path');
const express = require('express');
// const socket = require("socket.io");
const ejs = require('ejs');
// const http = require("http");
// const fs  = require("fs");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const chatapp = require('./chatapp');
const chatbot = require('./chatbot');

const PORT = 3000;


const app = express();
const chat = new chatapp();

app.use(cookieParser());

app.use(session({
    secret: String(Math.random()),
    saveUninitialized: true,
    resave: true
}));

// var loggedInUserID = -1;
const CHATBOTUSERID = 1;
var myChatBot=null

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use(express.static('public'));
app.set('view engine', 'ejs');

// console.log('app.get loggedInUserID:', req.session.userID);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login_page.html');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    // app.set('loggedInUserID', -1);
    res.redirect('/');
});

app.post('/login', (req, res) => {
    chat.login(req.body.username, req.body.password).then(userid => {
        req.session.userID = userid;
        req.session.lastSentAt = 0;
        req.session.refreshIntervalId = 0;
        req.session.lastConnectionCheck = 0;
        req.session.save();
        if (userid) {
            myChatBot = new chatbot(userid);
            myChatBot.setUp()
                .then(() => {
                    res.redirect(`/userPage/0`)
                })
                .catch(error => {
                    console.error('Error setting up chatbot:', error);
                    res.status(500).send('Internal Server Error');
                });
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
        if (!req.session.userID) {
            res.redirect('/?invalidRequest');
            return;
        }

        var conversationID = req.params.conversationID;
        chat.getConversationID(CHATBOTUSERID, req.session.userID).then(convos => {
            if (conversationID == 0) {
                conversationID = convos[0].ConversationID;
            }
            // Fetch messages for the authenticated user from the database
            chat.getAllConversationsForUser(req.session.userID).then(conversations => {
                // console.log('conversations: ', req.session.userID, conversations)
                // const allConvos = JSON.parse(JSON.stringify(conversations));
                chat.getAllOtherUsers(req.session.userID).then(otherUsers => {
                    // console.log(req.session.userID);
                    chat.getAllMessagesInConversation(conversationID).then(messages => {
                        ejs.renderFile(__dirname + '/user_page.ejs',
                            {
                                convos: conversations,
                                users: otherUsers,
                                messages: messages,
                                partner: { username: 'Username', icon: 'pic' },
                                conversationID: conversationID,
                                userID: req.session.userID
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
    // console.log("add conco");
    const partnerUserID = req.body.partnerID;
    // console.log("req params", req.params);
    // console.log("req body", req.body);
    chat.getConversationID(req.session.userID, partnerUserID).then(convoID => {
        // console.log("convoID", convoID);
        if (convoID.length > 0) {
            // console.log("in add convo");
            chat.getAllConversationsForUser(req.session.userID).then(conversations => {
                res.redirect(`/userPage/${convoID[0].ConversationID}`);
            });
        } else {
            chat.addConversation(req.session.userID, partnerUserID).then((conversationID) => {
                // console.log("addconvo convoID: ", conversationID);
                res.redirect(`/userPage/${conversationID}`);
            });
        }
    })
})

app.get('/deleteConvo/:conversationID', (req, res) => {
    console.log("delete convo:", req.params.conversationID);
    const conversationID = req.params.conversationID;
    chat.deleteConversation(conversationID).then(() => {
        chat.getAllConversationsForUser(req.session.userID).then(conversations => {
            console.log("going to redirect");
            res.redirect(`/userPage/0`);
        })
    });
})

app.post('/sendMessage/:conversationID', (req, res) => {
    // console.log("YIMB3");
    // console.log("YIMB",myChatBot.conversationID);
    if (req.params.conversationID == myChatBot.conversationID){
        myChatBot.chat(req.body.Content)
            .then(() => {
                res.redirect(`/userPage/${req.params.conversationID}`);
            });
    } else{
    // console.log("got chat message: ", req.body.Content);
    chat.addMessage(req.params.conversationID, req.session.userID, req.body.Content).then(messageid => {
            if (messageid) {
                res.redirect(`/userPage/${req.params.conversationID}`);
            } else {
                console.log('Error fetching messages');
                // res.status(500).send('Internal Server Error');
            }
        });
    }
});

const EXPIRED_INTERVAL = 59999; // 60 secs
// chat.getLatestMessageForUser(req.session.userID).then(latestMessages => {
//     // Assuming there's at least one conversation in the database
//     req.session.lastSentAt = latestMessages[0].sentAt;
//     console.log("start with last message sent:", req.session.lastSentAt, "last expired:", req.session.lastConnectionCheck);
// });

app.get('/checkMessage', (req, res) => {
    // console.log(req.session.userID, "new request to poll");
    req.session.lastConnectionCheck = new Date().getTime();
    clearInterval(req.session.refreshIntervalId);
    checkMessage(req, res);
});

function checkMessage(req, res) {
    chat.getLatestMessageForUser(req.session.userID).then(latestMessage => {
        const currentTime = new Date().getTime();
        const latestSentAt = latestMessage[0].SentAt;
        // console.log(req.session.userID, "getting last message:", latestSentAt, "lastSentAt:", req.session.lastSentAt);
        if (req.session.lastSentAt == 0){
            // console.log(req.session.userID, "initializing lastSentAt");
            req.session.lastSentAt = latestMessage[0].SentAt;
            req.session.refreshIntervalId = setTimeout(function() { checkMessage(req, res) }, 2000);
        } else if (latestSentAt != req.session.lastSentAt) {
            // console.log(req.session.userID, "found a new message! latest: [", latestMessage[0].sentAt, "] lastSentAt: [", req.session.lastSentAt, currentTime, "]", typeof(latestSentAt));
            req.session.lastSentAt = latestMessage[0].SentAt;
            res.send(200, {'polling': 'FOUND'});
            // res.end();
        } else if (currentTime - req.session.lastConnectionCheck >= EXPIRED_INTERVAL) {
            // console.log(req.session.userID, "expired connection.... Restarting now: ", currentTime);
            res.send(200, {'polling': 'EXPIRED'});
            // res.end();
            req.session.lastConnectionCheck = currentTime;
        } else {
            // console.log(req.session.userID, "continue pollin...", latestSentAt);
            req.session.refreshIntervalId = setTimeout(function() { checkMessage(req, res) }, 2000);
        }
    })
    // todo: check if a new message
    // if (date-request.socket._idleStart.getTime() > 59999) {
    //     console.log("checkMessage: time expired...!");
    //     res.writeHead(200, {
    //         'Content-Type'   : 'text/plain',
    //         'Access-Control-Allow-Origin' : '*'
    //     });
    // }

    // check if new message for current user
    // return response
    // if time now > 59999 -> EXPIRED
    // if (counter > 5) {
    //     counter = 0;
    //     res.write('FOUND!', 'utf8');
    //     res.end();
    // } else {
    //     setTimeout(function() { checkMessage(req, res) }, 2000);
    // }

    // // we check the information from the file, especially

    // // to know when it was changed for the last time
    // fs.stat('/polling', function(err, stats) {
    //     console.log("checkMessage: file has changed...!");
    //     // if the file is changed
    //     if (stats.mtime.getTime() > req.socket._idleStart.getTime()) { 
    //         // read it
    //         fs.readFile('/polling', 'utf8', function(err, data) {        
    //             // return the contents
    //             res.writeHead(200, {
    //                 'Content-Type'   : 'text/plain',
    //                 'Access-Control-Allow-Origin' : '*'
    //             });
                
    //             // return response
    //             res.write(data, 'utf8');
    //             res.end();
                
    //             // return    
    //             return false;
    //         });
    //     }
    // });

};

app.listen(PORT);
// const server = app.listen(PORT, function () {
//     console.log(`app: Listening on port ${PORT}`);
//     console.log(`app: http://localhost:${PORT}`);
// });

// // Socket setup
// const activeUsers = new Set();
// // const io = socket(server);
// const io = socket(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],
//         transports: ['websocket', 'polling'],
//         credentials: true
//     },
//     allowEIO3: true
// });


// io.on("connection", function (socket) {
//     console.log("io: Made socket connection");

//     socket.on("new user", function (data) {
//     socket.userId = data;
//         activeUsers.add(data);
//         io.emit("new user", [...activeUsers]);
//     });

//     socket.on("chat message", function (data) {
//         console.log("io: got: chat message!!!!");
//         // socket.userId = data;
//         // activeUsers.add(data);
//         // io.emit("refresh", [...activeUsers]);
//         io.emit("refresh", data);
//     });

//     socket.on("disconnect", () => {
//         activeUsers.delete(socket.userId);
//         io.emit("user disconnected", socket.userId);
//     });
// });
