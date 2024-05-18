const path = require('path');
const express = require('express');
const chatapp = require('./chatapp');
const ejs = require('ejs')
const app = express();
const chat = new chatapp();
let USERID;
let PARTNERID;
app.use(express.json());
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    USERID = ""
    res.sendFile(__dirname + '/login_page.html');
});

app.post('/login', (req, res) => {
    chat.login(req.body.username, req.body.password).then(userid => {
        if (userid) {
            USERID = userid;
            res.redirect(`/userPage/${userid}`)
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

app.post('/createUser', (req, res) =>{
    chat.createUser(req.body.username, req.body.email, req.body.password)
    res.redirect('/')
});


app.get('/userPage/:userId', (req, res)=> {
    try {
        // Fetch messages for the authenticated user from the database
       chat.getAllConversationsForUser(req.params.userId).then(conversations =>{
        
        let allConvos = JSON.parse(JSON.stringify(conversations))
        // let allConvosID = []
        // allConvos.forEach(conversation => {
        //     allConvosID.push(conversation.ConversationID)
        // }); 
        console.log(allConvos)
        ejs.renderFile(__dirname + '/user_page.ejs', { convos: allConvos }, (err, html) => {
            if (err) {
                console.error('Error rendering template:', err);
                res.status(500).send('Internal Server Error');
            } else {
                res.send(html);
            }
        });
       })
        
        //Render the messages.ejs template with the fetched messages
        
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/conversation/:conversationId', (req, res) => {
    const conversationId = req.params.conversationId;
    // Fetch conversation data based on conversationId
    // Render a page with the full conversation data
    //res.send(`Display full conversation for conversation ID: ${conversationId}`);
    try {
    chat.getAllMessagesInConversation(conversationId).then(messages =>{
        let allMessages = JSON.parse(JSON.stringify(messages));
        chat.getAllUsers().then(users =>{
            console.log(users)
            let allUsers = JSON.parse(JSON.stringify(users));
            const userMap = {};
            allUsers.forEach(user => {
                userMap[user.UserID] = user.Username;
            });
            allMessages.forEach(message=>{
                message.SenderID = userMap[message.SenderID];
            })

            ejs.renderFile(__dirname + '/conversation_page.ejs', { conversation: allMessages }, (err, html) => {
                if (err) {
                    console.error('Error rendering template:', err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.send(html);
                }
            });
        })
        
        // allMessages.forEach(message => {
        //     message
        // });
        
        
        })
    }catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Internal Server Error');
    }

    
});

app.post('/addUser/:userId', (req, res)=>{
    const UserId = req.params.userId
    const partnerUserID = req.body.partnerId
    chat.addConversation(UserId, partnerUserID)
    res.redirect(`/userPage/${UserId}`)
})

app.post('/deleteUser/:userId', (req, res)=>{
    const UserId = req.params.userId
    const conversationID = req.body.partnerId
    chat.deleteConversation(conversationID)
    res.redirect(`/userPage/${UserId}`)
})

app.post('/sendMessage/:conversationId', (req, res) => {
    chat.addMessage(req.params.conversationId, USERID, req.body.Content).then(messageid => {
        if (messageid) {
            res.redirect(`/conversation/${req.params.conversationId}`)
        } else {
            console.error('Error fetching messages:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.listen(3000);