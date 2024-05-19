const mysql = require('mysql');
const CHATBOTUSERID = 1;
class ChatAppAPI {
    constructor() {
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: 'chat-app.c7c4e6ag4ueq.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: 'chatapp123',
            database: 'Chat_App',
            port: 3306
        });
    }

    async login(username, password) {
        try {
            const connection = await this.getConnection();

            const usernameQuery = 'SELECT * FROM Users WHERE username = (?)';
            const users = await this.query(connection, usernameQuery, [username]);
            if (users.length == 0) {
                console.log("Login failed. Invalid username:")
                return null;
            }

            const passwordQuery = 'SELECT * FROM Users WHERE password = (?)';
            const pass = await this.query(connection, passwordQuery, [password]);
            // not case sensitive
            if (pass.length == 0) {
                console.log("Login failed. Invalid password:")
                return null;
            }

            connection.release();

            return users[0].UserID;
        } catch (error) {
            console.error("Error getting all users:", error);
            return null;
        }
    }

    async createUser(username, email, password) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();

            //Create new user
            const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
            const result = await this.query(connection, query, [username, email, password]);
            const userID = result.insertId;
            console.log("createuser userid:", userID);

            //Create conversation between user and chatbot
            const convoID = await this.addConversationHelper(connection, CHATBOTUSERID, userID);
            console.log("createuser convoID:", convoID);
            const messageID = await this.addMessageHelper(connection, convoID, CHATBOTUSERID, "Hi, this is your friendly chatbot. What can I do for you today?");
            console.log("createuser messageID:", messageID);

            await connection.commit();

            connection.release();
            return (userID, convoID);
        } catch (error) {
            await connection.rollback();
            console.error("Error creating user:", error);
        }
    }

    async getAllUsers() {
        try {
            const connection = await this.getConnection();
            const query = 'SELECT * FROM Users';
            const users = await this.query(connection, query);
            connection.release();
            return users;
        } catch (error) {
            console.error("Error getting all users:", error);
            return [];
        }
    }

    async getAllOtherUsers(userId) {
        try {
            const connection = await this.getConnection();
            const query = 'SELECT UserID, Username FROM Users WHERE UserID != (?)';
            const users = await this.query(connection, query, [userId]);
            connection.release();
            return users;
        } catch (error) {
            console.error("Error getting all users:", error);
            return [];
        }
    }

    async addConversation(createdByUserID, partnerUserID) {
        const connection = await this.getConnection();
        try {
            console.log("addconvo is running");
            // Start a transaction
            // await connection.beginTransaction();

            const conversationID = await this.addConversationHelper(connection, createdByUserID, partnerUserID);

            // Commit the transaction
            // await connection.commit();

            // connection.release();
            return conversationID;
        } catch (error) {
            console.log("addconvo error!!", error);
            // Rollback the transaction in case of error
            await connection.rollback();
            console.error("Error adding conversation:", error);
            return null;
        }
    }

    async addConversationHelper(connection, createdByUserID, partnerUserID) {
        // Insert into Conversations table
        const conversationQuery = 'INSERT INTO Conversations (createdByUserID) VALUES (?)';
        const conversationResult = await this.query(connection, conversationQuery, [createdByUserID]);
        const conversationID = conversationResult.insertId;
        console.log("addconvo inserted, convoID", conversationID);

        // Insert into User_Conversation table
        const userConversationQuery = 'INSERT INTO User_Conversation (UserID, ConversationID) VALUES (?, ?)';
        await this.query(connection, userConversationQuery, [createdByUserID, conversationID]);
        await this.query(connection, userConversationQuery, [partnerUserID, conversationID]);
        console.log("addconvo inserted #2");

        return conversationID;
    }

    async deleteConversation(conversationID) {
        try {
            const connection = await this.getConnection();

            // Start a transaction
            await connection.beginTransaction();

            // Delete from Messages
            const messagesQuery = 'DELETE FROM Messages WHERE conversationID = ?';
            await this.query(connection, messagesQuery, [conversationID]);

            // Delete from User_Conversation
            const userConvoQuery = 'DELETE FROM User_Conversation WHERE conversationID = ?';
            await this.query(connection, userConvoQuery, [conversationID]);

            // Delete from Conversations table
            const convoQuery = 'DELETE FROM Conversations WHERE conversationID = ?';
            const convoResult = await this.query(connection, convoQuery, [conversationID]);

            // Commit the transaction
            await connection.commit();

            connection.release();
            return convoResult;
        } catch (error) {
            // Rollback the transaction in case of error
            await connection.rollback();
            console.error("Error deleting conversation:", error);
            return null;
        }
    }

    async addMessage(conversationID, senderID, content) {
        try {
            const connection = await this.getConnection();

            const messageID = await this.addMessageHelper(connection, conversationID, senderID, content);

            connection.release();
            return messageID;
        } catch (error) {
            console.error("Error adding message:", error);
        }
    }

    async addMessageHelper(connection, conversationID, senderID, content) {
        const query = 'INSERT INTO Messages (conversationID, senderID, content) VALUES (?, ?, ?)';
        const result = await this.query(connection, query, [conversationID, senderID, content]);
        const messageID = result.insertId;
        return messageID;
    }

    async getConversationID(userID, partnerId) {
        try {
            const connection = await this.getConnection();
            const query = `
                SELECT UC.ConversationID
                FROM User_Conversation UC
                WHERE UC.UserID = (?)
                AND UC.ConversationID IN
                   (SELECT UC.ConversationID
                    FROM User_Conversation UC
                    WHERE UC.UserID = (?));`
            const result = await this.query(connection, query, [userID, partnerId]);
            connection.release();
            return result;
        } catch (error) {
            console.error("Error adding message:", error);
        }
    }

    async getAllMessagesInConversation(conversationID) {
        try {
            const connection = await this.getConnection();
            // const query = 'SELECT * FROM Messages WHERE conversationID = (?) ORDER BY SentAt';
            const query = `
                SELECT M.*, U.Username SenderUsername
                FROM Messages M
                INNER JOIN Users U
                ON M.SenderID = U.UserID
                WHERE conversationID = (?) 
                ORDER BY SentAt;`;
            const messages = await this.query(connection, query, [conversationID]);
            connection.release();
            return messages;
        } catch (error) {
            console.error("Error getting all messages in conversation:", error);
            return [];
        }
    }

    async getAllConversationsForUser(userID) {
        try {
            const connection = await this.getConnection();
            // Fetch all conversation IDs and other participant details
            const queryConversations = `
                SELECT DISTINCT
                    UC.ConversationID,
                    U.UserID,
                    U.Username
                FROM User_Conversation UC
                INNER JOIN Users U ON UC.UserID = U.UserID
                WHERE UC.ConversationID IN (
                    SELECT ConversationID
                    FROM User_Conversation
                    WHERE UserID = ?
                ) AND UC.UserID != ?;
            `;
            const conversations = await this.query(connection, queryConversations, [userID, userID]);
            
            // Prepare to collect last messages for each conversation
            const results = [];
    
            // Fetch last message for each conversation
            for (const conversation of conversations) {
                const queryLastMessage = `
                    SELECT 
                        Content AS LastSentMessage,
                        SentAt AS LastMessageTime
                    FROM Messages
                    WHERE ConversationID = ? AND SentAt = (
                        SELECT MAX(SentAt)
                        FROM Messages
                        WHERE ConversationID = ?
                    ) ORDER BY MessageID DESC
                    LIMIT 1;
                `;
                const lastMessage = await this.query(connection, queryLastMessage, [conversation.ConversationID, conversation.ConversationID]);
                if (lastMessage.length > 0) {
                    results.push({
                        ConversationID: conversation.ConversationID,
                        UserID: conversation.UserID,
                        Username: conversation.Username,
                        LastSentMessage: lastMessage[0].LastSentMessage,
                        LastMessageTime: lastMessage[0].LastMessageTime
                    });
                } else {
                    // Include conversation details even if there's no last message
                    results.push({
                        ConversationID: conversation.ConversationID,
                        UserID: conversation.UserID,
                        Username: conversation.Username,
                        LastSentMessage: null,
                        LastMessageTime: null
                    });
                }
            }
    
            connection.release();
            return results;
        } catch (error) {
            console.error("Error getting all conversations for user:", error);
            if (connection) connection.release();
            return [];
        }
    }
    

    async getLastMessageForConversation(conversationID) {
        try {
            const connection = await this.getConnection();
            const query = 'SELECT * FROM Messages WHERE conversationID = ? ORDER BY SentAt DESC LIMIT 1';
            const lastMessage = await this.query(connection, query, [conversationID]);
            connection.release();
            return lastMessage[0];
        } catch (error) {
            console.error("Error getting last message for conversation:", error);
            return null;
        }
    }

    async getConnection() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    async query(connection, sql, values) {
        return new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    async testConnection() {
        try {
            const connection = await this.getConnection();
            console.log('Connected to the database successfully.');
            connection.release();
        } catch (error) {
            console.error('Failed to connect to the database:', error);
        }
    }
}

module.exports = ChatAppAPI;
