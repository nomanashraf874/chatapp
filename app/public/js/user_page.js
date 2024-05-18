// Modal functionality
class UserPage {
    modal = document.getElementById("myModal");
    userID = window.location.pathname.split("/")[2];
    
    constructor() {
        this.initialize();
    }

    initialize() {
        console.log(this.userID);
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
            this.openModal("Enter User ID of who you want to talk to", "addConvo");
        }.bind(this);
        // Get the button that opens the delete conversation modal and add a click event
        const deleteConversationModal = document.getElementById("deleteConversationModal");
        deleteConversationModal.onclick = function () {
            this.openModal("Enter Conversation ID to delete", "deleteConvo");
        }.bind(this);
    }

    openModal(modalText, modalAction) {
        this.modal.style.display = "block";
        const label = document.getElementById('labelForConversation');
        label.innerHTML = modalText;
        const modalForm = document.getElementById('addConversation');
        modalForm.action = `/${modalAction}/${this.userID}`;
    }
}

const userPage = new UserPage();