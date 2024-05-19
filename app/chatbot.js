const ollama = require('ollama');
const ChatAppAPI = require('./chatapp');
const backend = new ChatAppAPI();


class ChatBot {
  botID = 1;
  conversationHistory;
  conversationID;
  constructor(userID) {
    this.currentUserID = userID;
  }


  async setUp(){
    await this.checkOrCreateConversation()
    await this.getAndFormatMessages()
    this.greet();
  }


  greet() {
    console.log("Welcome to my simple chatbot! Ask me anything or type 'exit' to leave.");
  }


  goodbye() {
    console.log("Thank you for chatting with me! Have a good day.");
  }


  async getResponse(inputQuestion) {
    try {
      const response = await ollama.default.chat({
        model: 'llama3',
        messages: this.conversationHistory,
        stream: false
      });
      return response.message.content;
    } catch (error) {
      console.error(`An error occurred: ${error}`);
      return "Sorry, I can't respond right now.";
    }
  }


  async checkOrCreateConversation() {
    //console.log(this.currentUserID)
    const existingConversations = await backend.getAllConversationsForUser(this.currentUserID)
    let conversation = existingConversations.find(convo =>
      convo.UserID === this.botID
    );

    if (!conversation) {
      const conversationID = await backend.addConversation(this.currentUserID, this.botID);
      console.log("Created a new conversation with ID:", conversationID);
      this.conversationID = conversationID;
    } else {
      console.log("Existing conversation found with ID:", conversation.ConversationID);
      this.conversationID = conversation.ConversationID;
    }
  }
  async getAndFormatMessages() {
    const messages = await backend.getAllMessagesInConversation(this.conversationID);
    this.conversationHistory = messages.map(message => ({
      role: message.senderID === this.currentUserId ? 'user' : 'assistant',
      content: message.content
    }));
  }

  async addMessageToConversation(senderID, messageContent) {
    const messageID = await backend.addMessage(this.conversationID, senderID, messageContent);
    console.log("Message added with ID:", messageID);
  }


  async chat(inputQuestion) {
    if (inputQuestion.toLowerCase() === "exit") {
      this.goodbye();
    } else {
      this.conversationHistory.push({ role: 'user', content: inputQuestion });
      const botResponse = await this.getResponse(inputQuestion);
      await this.addMessageToConversation(this.currentUserID,inputQuestion);
      await this.addMessageToConversation(this.botID,botResponse);
      console.log(`User: ${inputQuestion}`);
      console.log(`Bot: ${botResponse}`);
      this.conversationHistory.push({ role: 'assistant', content: botResponse });
    }
  }
}


// Example usage
(async () => {
//backend.createUser("chatbot","chatbot@noman.com","chatbot")
let res = await backend.getAllConversationsForUser(2)
console.log(res)
// const myChatBot = new ChatBot(2);
// await myChatBot.setUp()
// await myChatBot.chat("yo?");
// await myChatBot.chat("testing");
// await myChatBot.chat("exit");
})();



