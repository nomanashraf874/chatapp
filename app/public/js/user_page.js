// const ejs = require('ejs')
baseUrl = 'http://localhost:3000';

// Modal functionality
class UserPage {
    modal = document.getElementById("myModal");
    constructor() {
        this.initialize();
    }

    initialize() {
        
        console.log("initialize");
        
        // const socket = io({
        //     allowEIO3: true // false by default
        // });
        
        // console.log("initialize, created socket> ", socket);

        const closeButton = document.getElementsByClassName("close")[0];
        closeButton.onclick = function () {
            this.modal.style.display = "none";
        }.bind(this);
        window.onclick = function (event) {
            if (event.target == this.modal) {
                this.modal.style.display = "none";
            }
        }.bind(this);

        // Get the button that opens the add conversation modal and add a click event
        const addConversationModal = document.getElementById("addConversationModal");
        addConversationModal.onclick = function () {
            const partnerID = document.getElementById('partners').value;
            console.log("addconvomodal partnerid", partnerID);
            this.modal.style.display = "block";
            const label = document.getElementById('labelForConversation');
            label.innerHTML = "Choose a user to start a conversation with";
            const modalForm = document.getElementById('addConversation');
            modalForm.action = `/addConvo/${partnerID}`;
        }.bind(this);

        // const sendMessageEl = document.getElementById("message-submit-button");
        // console.log("get message button:", sendMessageEl);
        // sendMessageEl.onclick = function () {
        //     console.log("emit message to socket!");
        //     socket.emit("chat message", {});
        //     io.emit("chat message", {});
        //     socket.emit("chat message", { msg: "strange" });
        //     io.emit("chat message", { msg: "strange" });
        // }.bind(this);

        // socket.on("refresh", (event) => { 
        //     console.log("refresh on client. data:", event.data);
        //     if (event.data == 'refresh') {
        //         // location.reload();
        //     }
        // });
        
        // socket.emit("new user", "john doe");
    }

    deleteMessage(conversationID) {
        fetch(`${baseUrl}/deleteConvo/${conversationID}`, {method: "delete"})
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.text();
            })
            // .then(html => {
            //     document.getElementById('chat-container').innerHTML = html;
            // });
    }

    // addConvoWith() {
    //     const partnerID = document.getElementById('partners').value;
    //     console.log("parnterID:", `${baseUrl}/addConvo/${partnerID}`);
    //     fetch(`${baseUrl}/addConvo/${partnerID}`, {method: "post"})
    //         .then(res => {
    //             console.log("addconvowith() res: ", res);
    //             if (!res.ok) {
    //                 throw new Error(`HTTP error! Status: ${res.status}`);
    //             }
    //             return res.text();
    //         })
    //         .then(html => {
    //             console.log("addconvowith() html: ", html);
    //             document.getElementById('chat-container').innerHTML = html;
    //         });
    // }

    pollNode() {
        console.log("now polling...");
        const delayInMilliseconds = 1000; //1 second

        fetch(`${baseUrl}/checkMessage`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
            })
            .then(data =>
                {
                console.log("polling responded with res:...", data);
                if (data.polling == 'FOUND') {
                    location.reload();
                } 
                this.pollNode();                                
            });
    }
}

console.log("new userPage");
const userPage = new UserPage();
userPage.pollNode();

