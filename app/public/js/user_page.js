// const ejs = require('ejs')
baseUrl = 'http://localhost:3000';

// Modal functionality
class UserPage {
    modal = document.getElementById("myModal");
    constructor() {
        this.initialize();
    }

    initialize() {
        
        
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
    
    
}

const userPage = new UserPage();

