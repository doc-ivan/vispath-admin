// Imports //
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth, 
        onAuthStateChanged,
        signOut,
        signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getDatabase, 
        ref, 
        onValue, 
        set,  
        onDisconnect,
        serverTimestamp as fsServerTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


import { getFirestore,
        getDoc,  
        doc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// Firebase Setup //
const firebaseConfig = {
    apiKey: "AIzaSyD2MsAl5e9BX2Q6xzgFlsvkzGdkLZogTdQ",
    authDomain: "visionpath-33d48.firebaseapp.com",
    projectId: "visionpath-33d48",
    storageBucket: "visionpath-33d48.firebasestorage.app",
    messagingSenderId: "371488038314",
    appId: "1:371488038314:web:b6e3ab9c93bca867b8dfd3",
    databaseURL: "https://visionpath-33d48-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const DB = getDatabase(app);   


// Variable Declaration
const loginButton = document.getElementById("submit")
const sections = document.querySelectorAll(".sections")


// Event Listener
loginButton.addEventListener("click", (event) => {
    event.preventDefault()  // 🚫 Prevent form from reloading the page
    loginClicked()
})


// Function
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in, check if admin
        const adminRef = doc(db, "admins", user.uid)
        const adminSnap = await getDoc(adminRef)

        if (adminSnap.exists()) {
            theresLogInUser(user)
        } else {
            return
        }
    } 
})
async function loginClicked() {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    if (!email || !password) {
        showError("Please enter email and password.")
        return
    }

    try {
        await setOfflineOnLogout()
        await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
        showError("Invalid users credentials")
    }

}

// call this function when user logs out
async function setOfflineOnLogout() {
    const user = auth.currentUser
    if (!user) return

        const userDocRef = doc(db, "users", user.uid) // rename variable
        const userDocSnap = await getDoc(userDocRef)  // rename variable
        if(userDocSnap.exists() && userDocSnap.data().role === "user") { 
            // allow user page
            const uid = user.uid
            const userStatusRef = ref(DB, 'status/' + uid)
            await set(userStatusRef, {
                state: 'offline',
                last_changed: fsServerTimestamp()
            })
        } else {
            return
        }
}

function showError(message) {
    const errorElement = document.getElementById("invalid")
    errorElement.textContent = message
    errorElement.classList.add("show")
}

function hideError() {
    const errorElement = document.getElementById("invalid")
    errorElement.classList.remove("show")
}

function clearInputFields() {
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
}

function theresLogInUser(user) {
    hideError()
    clearInputFields()
    window.location.href = "Admin.html"
}


