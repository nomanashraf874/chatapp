baseUrl = 'http://localhost:3000';

class Login {
    // login(username, password) {
    //     let options = {
    //         method: "post",
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             'username': username,
    //             'password': password
    //         })
    //     }
    //     fetch(`${baseUrl}/login`, options)
    //         .then((res) => {
    //             if (!res.ok) {
    //                 throw new Error(`HTTP error! Status: ${res.status}`);
    //             }
    //             return res.json();
    //         })
    //         .then(res => {
    //             this.userID = res.userid;
    //             console.log("logged in:", this.userID);
    //         });
    // }

    constructor() {
        this.displayMessageIfError();
    }

    displayMessageIfError() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
            console.log("invalid username or password");
            var errorEl = document.getElementsByClassName("error-message")[0];
            console.log(errorEl);
            errorEl.classList.remove('hidden');
            window.history.pushState({}, document.title, "/");
        }
    }

    clearError() {
        var errorEl = document.getElementsByClassName("error-message")[0];
        errorEl.classList.add('hidden');
    }

    // sendMessage(message) {
    //     let options = {
    //         method: "post",
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             'conversationID': 1,
    //             'senderID': this.userID,
    //             'content': message
    //         })
    //     }
    //     fetch(`${baseUrl}/sendMessage`, options)
    //         .then(res => {
    //             if (!res.ok) {
    //                 throw new Error(`HTTP error! Status: ${res.status}`);
    //             }
    //             return res.json();
    //         })
    //         .then(res => {
    //             console.log("messages: ", res.messages);
    //             // Use res.messages to populate all messages
    //         });
    // }

}




const login = new Login();
