const path = require('path');
const express = require('express');
const chatapp = require('./chatapp');
const ejs = require('ejs')
const app = express();
const chat = new chatapp();

app.use(express.json());
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login_page.html');
});

app.post('/login', (req, res) => {
    chat.login(req.body.username, req.body.password).then(userid => {
        // res.send({ 'userid': userid });
        // res.end();
        res.redirect(`/userPage/${userid}`)
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
        let allConvosID = []
        allConvos.forEach(conversation => {
            allConvosID.push(conversation.ConversationID)
        }); 
        console.log(allConvosID)
        ejs.renderFile(__dirname + '/user_page.ejs', { messages: allConvosID }, (err, html) => {
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
    res.send(`Display full conversation for conversation ID: ${conversationId}`);
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