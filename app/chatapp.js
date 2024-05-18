const mysql = require('mysql');

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
            
            // console.log("start");
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
        try {
            const connection = await this.getConnection();
            const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
            await this.query(connection, query, [username, email, password]);
            connection.release();
        } catch (error) {
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

    async addConversation(createdByUserID, partnerUserID) {
        try {
            const connection = await this.getConnection();
            // Start a transaction
            await connection.beginTransaction();

            // Insert into Conversations table
            const conversationQuery = 'INSERT INTO Conversations (createdByUserID) VALUES (?)';
            const conversationResult = await this.query(connection, conversationQuery, [createdByUserID]);
            const conversationID = conversationResult.insertId;

            // Insert into User_Conversation table
            const userConversationQuery = 'INSERT INTO User_Conversation (UserID, ConversationID) VALUES (?, ?)';
            await this.query(connection, userConversationQuery, [createdByUserID, conversationID]);
            await this.query(connection, userConversationQuery, [partnerUserID, conversationID]);

            // Commit the transaction
            await connection.commit();

            connection.release();
            return conversationID;
        } catch (error) {
            // Rollback the transaction in case of error
            await connection.rollback();
            console.error("Error adding conversation:", error);
            return null;
        }
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
            const query = 'INSERT INTO Messages (conversationID, senderID, content) VALUES (?, ?, ?)';
            const result = await this.query(connection, query, [conversationID, senderID, content]);
            const messageID = result.insertId;

            connection.release();
            return messageID;
        } catch (error) {
            console.error("Error adding message:", error);
        }
    }

    async getAllMessagesInConversation(conversationID) {
        try {
            const connection = await this.getConnection();
            const query = 'SELECT * FROM Messages WHERE conversationID = (?) ORDER BY SentAt';
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
            // const query = 'SELECT Conversations.* FROM Conversations INNER JOIN User_Conversation ON Conversations.ConversationID = User_Conversation.ConversationID WHERE User_Conversation.UserID = ?';
            // const query =  `SELECT U.Username, UC.UserID, UC.ConversationID FROM User_Conversation UC 
            //                 INNER JOIN Users U Using (UserID)
            //                 WHERE ConversationID IN 
            //                     (SELECT ConversationID 
            //                      FROM User_Conversation 
            //                      WHERE UserID = (?)
            //                     )
            //                 AND UserID != (?);`;
            const query = 
                `WITH LastSent as (
                    SELECT MAX(sentAt) sentAt, conversationID 
                    FROM Messages 
                    GROUP BY conversationID
                ),
                LatestMessages as (
                    SELECT M.content, LS.sentAt, M.conversationID, M.senderID 
                    FROM Messages M 
                    INNER JOIN LastSent LS 
                    USING (sentAt, conversationID)
                )
                SELECT U.Username, UC.UserID, UC.ConversationID, LM.content lastSentMessage
                FROM User_Conversation UC 
                INNER JOIN Users U Using (UserID)
                LEFT JOIN LatestMessages LM ON UC.ConversationID = LM.ConversationID
                WHERE UC.ConversationID IN 
                    (SELECT ConversationID 
                    FROM User_Conversation 
                    WHERE UserID = (?))
                AND UserID != (?);`;
            const conversations = await this.query(connection, query, [userID, userID]);
            connection.release();
            return conversations;
        } catch (error) {
            console.error("Error getting all conversations for user:", error);
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
