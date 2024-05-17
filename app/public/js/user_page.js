// Modal functionality
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];
const currentUrl = window.location.href;
const UserId = currentUrl.slice(31)
console.log(UserId)
function openModal() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Get the button that opens the modal
const addConversationModal = document.getElementById("addConversationModal");
const deleteConversationModal = document.getElementById("deleteConversationModal")

// When the user clicks the button, open the modal
addConversationModal.onclick = function() {
    openModal();
    const modalForm = document.getElementById('addConversation');
    const label = document.getElementById('labelForConversation')
    label.innerHTML = "Enter User ID of who you want to talk to"
    modalForm.action = `/addUser/${UserId}`
}

deleteConversationModal.onclick = function() {
    openModal()
    const modalForm = document.getElementById('addConversation');
    const label = document.getElementById('labelForConversation')
    label.innerHTML = "Enter Conversation ID to delete"
    modalForm.action = `/deleteUser/${UserId}`
}


