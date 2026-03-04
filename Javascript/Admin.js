// Imports //
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth, 
        onAuthStateChanged,
        signOut,
        GoogleAuthProvider,
        signInWithPopup,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { 
        getDatabase, 
        ref, 
        onValue, 
        set,  
        onDisconnect,
        serverTimestamp as fsServerTimestamp,
        child,
        get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import { getFirestore, 
        collection, 
        addDoc, 
        updateDoc, 
        serverTimestamp, 
        onSnapshot, 
        query, 
        where, 
        orderBy, 
        doc,
        deleteDoc,
        getDocs,
        getDoc,
        increment,
        limit, 
        startAfter,
        Timestamp,
        setDoc,
        arrayRemove,
        arrayUnion  } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

// Initialize Firebase //
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);   
const provider = new GoogleAuthProvider();
const DB = getDatabase(app);  


// Cloudinary Configuration 
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/diymsdv8n/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'Vispath Image Storage' 

// Supabase Setup //
const supabaseUrl = "https://bdmvzdsincloyrbqjatd.supabase.co"
const supabaseKey = "sb_publishable_ahmawcKzsWZKr6ZxsXsKbQ_IyLFui1y"

const supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
)


let loginCheckTimeout
let popUpCheckTimeout

const navLinks = document.querySelectorAll(".nav-link")
const sections = document.querySelectorAll(".sections")

const popUp = document.getElementById("sign-in-sign-out-pop-up")

const hamburger = document.getElementById('hamburger')
const sidebar = document.getElementById('sidebar')

const saved = localStorage.getItem("activeNav")
let defaultNav = "dashboard"
const activeNav = saved || defaultNav

const dashboardSection = document.getElementById("dashboard-section")
const usersSection = document.getElementById("users-section")
const storiesSection = document.getElementById("stories-section")
const sharedFilesSection = document.getElementById("files-section")
const commentsSection = document.getElementById("comments-section")
const settingsSection = document.getElementById("settings-section")

const dashboardGrid = document.getElementById("dashboard-grid")

const tableStoriesContainer = document.getElementById("story-table-body")

const tableUsersContainer = document.getElementById("users-table-body")

const adminWrapper = document.querySelector(".admin-wrapper")
const tableAdminUsersContainer = document.getElementById("admin-users-table-body")

const cancelBtn = document.querySelector(".cancel-btn")
const saveBtn = document.querySelector(".save-btn")
let currentEditingStoryId = null
let currentStoryIdForSave = null // To keep track of the current story ID for save


const addPageBtn = document.querySelector(".add-page-btn")
const resetUploadFormBtn = document.querySelector(".reset-btn")
let pageCount = 1;
let pages = []; // Store all pages data

const tabLinks = document.querySelectorAll(".tab-link")
const tabContent = document.querySelectorAll(".tab-content")

const proFileDetailsContainer = document.querySelector(".profile-details")

window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '').toLowerCase()

    if (hash === 'users') {
        goToUsers()
    } else if (hash === 'stories') {
        goToStories()
    } else if (hash === 'shared') {
        goToSharedFiles()
    } else if (hash === 'comments') {
        goToComments()    
    } else if (hash === 'settings') {
        goToSettings()
    } else {
        goToDashboard()
    }
})

// ✅ Tumakbo kapag nag-load ang page
window.addEventListener("DOMContentLoaded", setActiveNavFromHash)

window.addEventListener("DOMContentLoaded", goToSavedSection)


// ✅ Tumakbo kapag gumamit ng Back/Forward button
window.addEventListener("hashchange", setActiveNavFromHash)

window.addEventListener("hashchange", saveLastHashToLocalStorage)


hamburger.addEventListener('click', function() {
    sidebar.classList.toggle('active')
    hamburger.classList.toggle('active')
})
        
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        navLinks.forEach(l => l.classList.remove('active'))
        this.classList.add('active')

        const spanText = link.textContent.toLowerCase()
        localStorage.setItem("activeNav", spanText)

        if (window.innerWidth <= 767) {
            sidebar.classList.remove('active')
            hamburger.classList.remove('active')
        }

        if (spanText === 'dashboard') {
            location.hash = ''
        } else {
            location.hash = spanText
        }      
    })
})

addPageBtn.addEventListener('click', function() {
    addPage()
})

resetUploadFormBtn.addEventListener('click', function() {
    resetUploadForm()
})



tabLinks.forEach(link => {
    link.addEventListener('click', function() {
        tabLinks.forEach(l => l.classList.remove('active'))
        this.classList.add('active')

        const tabData = link.getAttribute("tab-data")

        if (tabData === 'awaiting-verification') {
            const awaiting = document.getElementById("awaiting")
            tabContent.forEach(l => l.classList.remove('active'))

            awaiting.classList.add("active")

        } else if (tabData === 'failed-validation') {
            const failed = document.getElementById("failed")
            tabContent.forEach(l => l.classList.remove('active'))

            failed.classList.add("active")

        } else if (tabData === 'verified') {
            const verified = document.getElementById("verified")
            tabContent.forEach(l => l.classList.remove('active'))

            verified.classList.add("active")

        }           
    })
})



onAuthStateChanged(auth, async (user) => {
    // If user logs out, set up a timer to check for 5 seconds
    if (!user) {
        console.log("User logged out. Waiting for 5 seconds to check if a new user logs in...")

        // Start a timer for 5 seconds to check if a new user logs in
        loginCheckTimeout = setTimeout(() => {
            console.log("No user logged in after 5 seconds. Redirecting to login page...")
            // Redirect to login page or show any fallback action
            theresNoLoginUser(user)  // Change this to your login page
        }, 5000)
    } else {
        // If a user is logged in, cancel the waiting timer (if it's still running)
        if (loginCheckTimeout) {
            clearTimeout(loginCheckTimeout)
            loginCheckTimeout = null  // Reset the timer
        }

        // User is logged in, check if admin
        const adminRef = doc(db, "admins", user.uid)
        const adminSnap = await getDoc(adminRef)

        if (adminSnap.exists()) {
            console.log("Admin Current user UID:", user.uid)
            theresLoginUser(user)
            presenceDetector(user)
        } else {
            theresNoLoginUser(user)
        }
    }
})

function presenceDetector(user) {
    const uid = user.uid;
    const userStatusRef = ref(DB, 'status/' + uid)
    const connectedRef = ref(DB, '.info/connected')
    const userDocRef = doc(db, 'admins', uid)

    // kapag nag connect sa internet
    onValue(connectedRef, (snap) => {
        if (snap.val() === false) return
        // kapag nawala ang connection o isinara ang tab
        onDisconnect(userStatusRef).set({
        state: 'offline',
        last_changed: fsServerTimestamp()
        })

        // mark online sa Realtime DB
        set(userStatusRef, {
        state: 'online',
        last_changed: fsServerTimestamp()
        })
    })
}

function goToUsers() {
    resetScrollTop()
    location.hash = 'users'
    
    sections.forEach(section => {
        section.style.display = "none"
    })

    usersSection.style.display = "flex"
}

function goToStories() {
    resetScrollTop()
    location.hash = 'stories'
    
    sections.forEach(section => {
        section.style.display = "none"
    })

    storiesSection.style.display = "flex"
}

function goToSharedFiles() {
    resetScrollTop()
    location.hash = 'shared'

    sections.forEach(section => {
        section.style.display = "none"
    })

    sharedFilesSection.style.display = "flex"
}

function goToComments()  {
    resetScrollTop()
    location.hash = 'comments'
    
    sections.forEach(section => {
        section.style.display = "none"
    })

    commentsSection.style.display = "flex"
}

function goToSettings()  {
    resetScrollTop()
    location.hash = 'settings'
    
    sections.forEach(section => {
        section.style.display = "none"
    })

    settingsSection.style.display = "flex"
}


function goToDashboard() {
    resetScrollTop()
    location.hash = ''
    
    sections.forEach(section => {
        section.style.display = "none"
    })

    dashboardSection.style.display = "flex"
}


async function getStatusFromRealTimeDatabase(docId) {
    try {
        const dbRef = ref(DB, `status/${docId}`)
        const snapshot = await get(dbRef)

        if (snapshot.exists()) {
            const data = snapshot.val()

            // Get ang "state" field sa loob ng object
            if (data && data.state) {
                return data.state
            } else {
                return null
            }
        } else {
            return null
        }
    } catch (error) {
        return null
    }
}


        async function fetchDashBoardDatas() {
            const totalStory = await countHowManyStory()
            const totalAccounts = await countHowManyAccounts()
            const mostReadStory = await findMostReadStory()
            const activeNow = await howManyActiveNow()

            renderDashBoardDatas(totalStory, totalAccounts, mostReadStory, activeNow)
        }

        // Function 1: Count all stories in 'stories' collection
        async function countHowManyStory() {
            const storiesSnapshot = await getDocs(collection(db, "stories"))
            return storiesSnapshot.size
        }

        // Function 2: Count all accounts in 'users' collection
        async function countHowManyAccounts() {
            const usersSnapshot = await getDocs(collection(db, "users"))
            return usersSnapshot.size
        }

        // Function 3: Find the most read story (highest 'views' field)
        async function findMostReadStory() {
            const storiesRef = collection(db, "stories")
            const q = query(storiesRef, orderBy("views", "desc"), limit(1))
            const snapshot = await getDocs(q)

            if (!snapshot.empty) {
                const storyDoc = snapshot.docs[0]
                return { id: storyDoc.id, ...storyDoc.data() }
            } else {
                return null
            }
        }

        // Function 4: Count how many users are currently active (online) in Realtime Database
        async function howManyActiveNow() {
            // 1. Get all users UIDs from Firestore users collection
            const usersSnapshot = await getDocs(collection(db, "users"))
            const userUIDs = usersSnapshot.docs.map(doc => doc.id)

            // 2. Get the status from Realtime Database
            const statusRef = ref(DB, "status")
            const snapshot = await get(statusRef)

            if (!snapshot.exists()) return 0

            const usersStatus = snapshot.val()
            let onlineCount = 0

            // 3. Count only users (exclude admins)
            for (const uid of userUIDs) {
                if (usersStatus[uid] && usersStatus[uid].state === "online") {
                    onlineCount++
                }
            }

            return onlineCount
        }

        function renderDashBoardDatas(totalStory, totalAccounts, mostReadStory, activeNow) {
            dashboardGrid.innerHTML = ""

            const statCard1 = document.createElement("div")
            statCard1.className = "stat-card"

            const statCard2 = document.createElement("div")
            statCard2.className = "stat-card"

            const statCard3 = document.createElement("div")
            statCard3.className = "stat-card"

            const statCard4 = document.createElement("div")
            statCard4.className = "stat-card"

            statCard1.innerHTML = `
                <div class="stat-icon stories-icon">📚</div>
                <div class="stat-info">
                    <h3>Total Stories</h3>
                    <p class="stat-number">${totalStory}</p>
                    <span class="stat-label">Active Stories</span>
                </div>
            `

            statCard2.innerHTML = `
                <div class="stat-icon readers-icon">👥</div>
                <div class="stat-info">
                    <h3>Total Accounts</h3>
                    <p  class="stat-number">${totalAccounts}</p>
                    <span class="stat-label">Total Readers</span>
                </div>
            `

            statCard3.innerHTML = `
                <div class="stat-icon popular-icon">⭐</div>
                <div class="stat-info">
                    <h3>Most Read Story</h3>
                    <p class="stat-number">${mostReadStory.views}</p>
                    <span class="stat-label">${toTitleCase(mostReadStory.title)}</span>
                </div>
            `

            statCard4.innerHTML = `
                <div class="stat-icon users-icon">🟢</div>
                <div class="stat-info">
                    <h3>Active Users</h3>
                    <p class="stat-number">${activeNow}</p>
                    <span class="stat-label">Online Right Now</span>
                </div>
            `

            dashboardGrid.appendChild(statCard1)
            dashboardGrid.appendChild(statCard2)
            dashboardGrid.appendChild(statCard3)
            dashboardGrid.appendChild(statCard4)
        }




        function renderUsersFromDB(doc) {
            const users = doc.data()

            const userEl = document.createElement("tr")
            userEl.setAttribute("data-id", doc.id)

            userEl.innerHTML = `
                <td>${users.email}</td>
                <td><span id="status-${doc.id}" class="status-badge">Loading...</span></td>
                <td>${toTitleCase(users.role)}</td>
                <td>${formatDate(users.createdAt)}</td>
                <td><button class="delete-btn">Delete</button></td>
            `

            tableUsersContainer.appendChild(userEl)

            // Kunin ang status at palitan ang laman ng cell
            getStatusFromRealTimeDatabase(doc.id).then(status => {
                const statusSpan = document.getElementById(`status-${doc.id}`)
                if (statusSpan) {
                    statusSpan.textContent = status || 'N/A'
                    statusSpan.classList.add(toLowerCase(status))
                }
            })

            userEl.classList.add("highlight")
            setTimeout(() => {
                userEl.classList.remove("highlight")
            }, 3000)


            const deleteBtn = userEl.querySelector(".delete-btn")
            deleteBtn.addEventListener("click", () => deleteUser(doc.id))
        }

        // helper function to update existing row
        function updateUserRow(row, doc) {
            const users = doc.data()
            row.innerHTML = `
                <td>${users.email}</td>
                <td><span id="status-${doc.id}" class="status-badge">Loading...</span></td>
                <td>${toTitleCase(users.role)}</td>
                <td>${formatDate(users.createdAt)}</td>
                <td><button class="delete-btn">Delete</button></td>
            `

            getStatusFromRealTimeDatabase(doc.id).then(status => {
                const statusSpan = document.getElementById(`status-${doc.id}`)
                if (statusSpan) {
                    statusSpan.textContent = status || 'N/A'
                    statusSpan.classList.add(toLowerCase(status))
                }
            })

            // re-add delete button listener
            const deleteBtn = row.querySelector(".delete-btn")
            deleteBtn.addEventListener("click", () => deleteUser(doc.id))
        }

        function fetchInRealTimeUsersFromDB(q) {
            // stop previous listener (if exists)
            if (unsubscribeInUsers) unsubscribeInUsers()

            unsubscribeInUsers = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    tableUsersContainer.innerHTML = `
                        <tr>
                            <td</td>
                            <td><span></span></td>
                            <td></td>
                            <td</td>
                            <td><button></button></td>
                        </tr>
                    `
                    return
                }
                snapshot.docChanges().forEach(change => {
                    const docId = change.doc.id

                    if (change.type === "added") {
                        const existingRow = tableUsersContainer.querySelector(`tr[data-id="${docId}"]`)
                        if (!existingRow) {
                            renderUsersFromDB(change.doc)
                        }
                    } 
                    else if (change.type === "modified") {
                        const row = tableUsersContainer.querySelector(`tr[data-id="${docId}"]`)
                        if (row) updateUserRow(row, change.doc)
                    } 
                    else if (change.type === "removed") {
                        const row = tableUsersContainer.querySelector(`tr[data-id="${docId}"]`)
                        if (row) row.remove()
                    }
                })

                lastVisibleUserInUsers = snapshot.docs[snapshot.docs.length - 1]
            })
        }

        let lastVisibleUserInUsers = null
        let isFetchingInUsers = false
        let unsubscribeInUsers = null
        const fetchPerBatch = 100 // adjust depende sa screen mo

        function fetchAllUsers() {
            const usersRef = collection(db, "users")
            const q = query(usersRef, orderBy("email", "asc"), limit(fetchPerBatch))

            // initial real-time batch
            fetchInRealTimeUsersFromDB(q)

            // scroll event for next batches
            const userTableWrapper = document.querySelector(".user-wrapper")

            let lastScrollTop = 0

            userTableWrapper.addEventListener("scroll", async (e) => {
                const currentScrollTop = e.target.scrollTop

                // only trigger if user scrolled vertically
                if (currentScrollTop !== lastScrollTop) {
                    const nearBottom =
                        userTableWrapper.scrollTop + userTableWrapper.clientHeight >=
                        userTableWrapper.scrollHeight - 50

                    if (nearBottom && !isFetchingInUsers && lastVisibleUserInUsers) {
                        isFetchingInUsers = true
                        await loadMoreUsers()
                        isFetchingInUsers = false
                    }
                }

                lastScrollTop = currentScrollTop
            })

        }

        async function loadMoreUsers() {
            const usersRef = collection(db, "users")
            const nextQuery = query(
                usersRef,
                orderBy("email", "asc"),
                startAfter(lastVisibleUserInUsers),
                limit(fetchPerBatch)
            )

            console.log("FETCHING")

            const snapshot = await getDocs(nextQuery)

            // 🔹 Kapag walang laman ang next batch, ibig sabihin ubos na
            if (snapshot.empty) {
                return false
            } else {
                fetchInRealTimeUsersFromDB(nextQuery)
            }

        }



function renderAdminUsersFromDB(doc) {
    const admin = doc.data()

    const adminEl = document.createElement("tr")
    adminEl.setAttribute("data-id", doc.id)

    adminEl.innerHTML = `
        <td>${admin.email}</td>
        <td><span id="status-${doc.id}" class="status-badge">Loading...</span></td>
        <td>${toTitleCase(admin.role)}</td>
        <td>${formatDate(admin.createdAt)}</td>
        <td><button class="delete-btn">Delete</button></td>
    `

    tableAdminUsersContainer.appendChild(adminEl)

    getStatusFromRealTimeDatabase(doc.id).then(status => {
        const statusSpan = document.getElementById(`status-${doc.id}`)
        if (statusSpan) {
            statusSpan.textContent = status || 'N/A'
            statusSpan.classList.add(toLowerCase(status))
        }
    })

    adminEl.classList.add("highlight")

    setTimeout(() => {
        adminEl.classList.remove("highlight")
    }, 3000)

    const deleteBtn = adminEl.querySelector(".delete-btn")
    deleteBtn.addEventListener("click", () => deleteUser(doc.id))
}

// helper function to update existing row
function updateAdminRow(row, doc) {
    const admin = doc.data()

    row.innerHTML = `
        <td>${admin.email}</td>
        <td><span id="status-${doc.id}" class="status-badge">Loading...</span></td>
        <td>${toTitleCase(admin.role)}</td>
        <td>${formatDate(admin.createdAt)}</td>
        <td><button class="delete-btn">Delete</button></td>
    `

    getStatusFromRealTimeDatabase(doc.id).then(status => {
        const statusSpan = document.getElementById(`status-${doc.id}`)
        if (statusSpan) {
            statusSpan.textContent = status || 'N/A'
            statusSpan.classList.add(toLowerCase(status))
        }
    })

    // re-add delete button listener
    const deleteBtn = row.querySelector(".delete-btn")
    deleteBtn.addEventListener("click", () => deleteUser(doc.id))
}


function fetchInRealTimeAdminUsersFromDB(q) {
    // stop previous listener (if exists)
    if (unsubscribeInAdmin) unsubscribeInAdmin()

    unsubscribeInAdmin = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            tableAdminUsersContainer.innerHTML = `
                <tr>
                    <td</td>
                    <td><span></span></td>
                    <td></td>
                    <td</td>
                    <td><button></button></td>
                </tr>
            `
            return
        }

        snapshot.docChanges().forEach(change => {
            const docId = change.doc.id

            if (change.type === "added") {
                const existingRow = tableAdminUsersContainer.querySelector(`tr[data-id="${docId}"]`)
                if (!existingRow) {
                    renderAdminUsersFromDB(change.doc)
                }
            } 
            else if (change.type === "modified") {
                const row = tableAdminUsersContainer.querySelector(`tr[data-id="${docId}"]`)
                if (row) updateAdminRow(row, change.doc)
            } 
            else if (change.type === "removed") {
                const row = tableAdminUsersContainer.querySelector(`tr[data-id="${docId}"]`)
                if (row) row.remove()
            }
        })

        lastVisibleAdmin = snapshot.docs[snapshot.docs.length - 1]
    })
}

let lastVisibleAdmin = null
let isFetchingInAdmin = false
let unsubscribeInAdmin = null

async function fetchAllNormalAdmins(currentUser) {
    if (!currentUser) {
        console.error("User not logged in")
        return
    }

    // Step 1: Check current user's role
    const currentUserDoc = await getDoc(doc(db, "admins", currentUser.uid))
    if (!currentUserDoc.exists()) {
        console.error("Current user not found in admins collection")
        return
    }

    const role = currentUserDoc.data().role
    if (role !== "superadmin") {
        console.log("Current user role:", role);
        adminWrapper.style.display = "none"
        console.error("Access denied: only superadmin can fetch normal admins")
        return
    }

    console.log("Current user role:", role);
    adminWrapper.style.display = "block"

    // Step 2: Fetch all normal admins (role != superadmin)
    const adminsRef = collection(db, "admins")
    const q = query(adminsRef, where("role", "!=", "superadmin"), orderBy("email", "asc"), limit(fetchPerBatch))

    // Step 3: Use real-time helper
    fetchInRealTimeAdminUsersFromDB(q)

    // scroll event for next batches
    const adminTableWrapper = document.querySelector(".admin-wrapper")

    let lastScrollTop = 0

    adminTableWrapper.addEventListener("scroll", async (e) => {
        const currentScrollTop = e.target.scrollTop

        // only trigger if user scrolled vertically
        if (currentScrollTop !== lastScrollTop) {
            const nearBottom =
                adminTableWrapper.scrollTop + adminTableWrapper.clientHeight >=
                adminTableWrapper.scrollHeight - 50

            if (nearBottom && !isFetchingInAdmin && lastVisibleAdmin) {
                isFetchingInAdmin = true
                await loadMoreAdmins()
                isFetchingInAdmin = false
            }
        }

        lastScrollTop = currentScrollTop
    })
}

async function loadMoreAdmins() {
    const adminsRef = collection(db, "admins")
    const nextQuery = query(
        adminsRef,
        where("role", "!=", "superadmin"),
        orderBy("email", "asc"),
        startAfter(lastVisibleAdmin),
        limit(fetchPerBatch)
    )


    console.log("FETCHING")

    const snapshot = await getDocs(nextQuery)

    // 🔹 Kapag walang laman ang next batch, ibig sabihin ubos na
    if (snapshot.empty) {
        return false
    } else {
        fetchInRealTimeAdminUsersFromDB(nextQuery)
    }
}

function deleteUser(docId) {
  // Make sure docId is not empty
    popUp.innerHTML = `
        <div class="popup-card" data-id="${docId}">

            <!-- Popup Heading -->
            <h2 class="popup-heading">Delete User</h2>

            <!-- Popup Message -->
            <p class="popup-message">
                Are you sure you want to delete this account? This action cannot be undone.
            </p>

            <!-- Action Buttons -->
            <div class="popup-actions">
                <button class="btn btn-cancel">
                Cancel
                </button>
                <button class="btn btn-delete">
                Delete User
                </button>
            </div>

        </div>
    `
    popUp.style.display = "flex"

    const deleteUserBtn = popUp.querySelector(".btn-delete")
    deleteUserBtn.addEventListener("click", () => {
        deleteUserdoc(docId);
    })

    const cancelBtn = popUp.querySelector(".btn-cancel")
    cancelBtn.addEventListener("click", () => {
        removeDeletePopup()
    })
}

function removeDeletePopup() {
    popUp.style.display = "none"
    popUp.innerHTML = ""
}

function deleteUserdoc(docId) {
    if (!docId) {
        alert("Please enter a UID!")
        return
    }

    fetch(`http://localhost:3000/delete-user/${docId}`, {
        method: "DELETE",
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            alert(`User ${docId} deleted successfully!`)
        } else {
            alert(`Error: ${data.error}`)
        }
    })
    .catch((error) => {
        console.error("Error deleting user:", error)
        alert("An error occurred. Check console for details.")
    })

    console.log("Delete user with this uid: ", docId)

    if (popUpCheckTimeout) {
        clearTimeout(popUpCheckTimeout)
        popUpCheckTimeout = null  // Reset the timer
        popUp.style.display = "none"
        popUp.innerHTML = ""
    }

    const popUpCard = popUp.querySelector(`[data-id="${docId}"]`)
    popUpCard.innerHTML = `
        <div class="spinner"></div>
    `

    popUp.style.display = "flex"

    popUpCheckTimeout = setTimeout(() => {
            popUp.style.display = "none"
            popUp.innerHTML = ""
    }, 3000)
}

function AdminSectionStoriesFromDB(doc) {
    const story = doc.data()

    const storyEl = document.createElement("tr")
    storyEl.setAttribute("data-id", doc.id)

    storyEl.innerHTML = `
        <td><div><img src="${story.coverUrl}" class="story-cover "></div></td>
        <td class="story-title">${toTitleCase(story.title)}</td>
        <td>${toTitleCase(story.author)}</td>
        <td><span class="type-badge ${toLowerCase(story.type)}">${toTitleCase(story.type)}</span></td>
        <td>${formatDate(story.uploadedAt)}</td>
        <td>${story.views}</td>
        <td>${toTitleCase(story.language)}</td>
        <td><ul>${story.genre.map(genre => `<li>${genre}</li>`).join('')}</ul></td>
        <td class="synopsis">${story.synopsis}</td>
        <td>
            <div class="action-buttons">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </td>
    `

    tableStoriesContainer.appendChild(storyEl)
        // Highlight effect for 1 second
    storyEl.classList.add("highlight")
    setTimeout(() => {
        storyEl.classList.remove("highlight")
    }, 3000)


    const editBtn = storyEl.querySelector(".edit-btn")
    editBtn.addEventListener("click", () => {
        openEditForm(doc.id)
    })

    const deleteBtn = storyEl.querySelector(".delete-btn")
    deleteBtn.addEventListener("click", () => {
        deleteStoryPopUp(doc.id)
    })
}

        // helper function to update existing row
        function updateStoryRow(row, doc) {
            const story = doc.data()
            row.innerHTML = `
                <td><div><img src="${story.coverUrl}" class="story-cover "></div></td>
                <td class="story-title">${toTitleCase(story.title)}</td>
                <td>${toTitleCase(story.author)}</td>
                <td><span class="type-badge ${toLowerCase(story.type)}">${toTitleCase(story.type)}</span></td>
                <td>${formatDate(story.uploadedAt)}</td>
                <td>${story.views}</td>
                <td>${toTitleCase(story.language)}</td>
                <td><ul>${story.genre.map(genre => `<li>${genre}</li>`).join('')}</ul></td>
                <td class="synopsis">${story.synopsis}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                </td>
            `

            // Highlight effect for 1 second
            row.classList.add("highlight")
            setTimeout(() => {
                row.classList.remove("highlight")
            }, 3000)


            const editBtn = row.querySelector(".edit-btn")
            editBtn.addEventListener("click", () => {
                openEditForm(doc.id)
            })

            const deleteBtn = row.querySelector(".delete-btn")
            deleteBtn.addEventListener("click", () => {
                deleteStoryPopUp(doc.id)
            })
        }

        function AdminSectionFetchInRealTimeStoriesFromDB(q) {
            // stop previous listener (if exists)
            if (unsubscribeInStories) unsubscribeInStories()

            unsubscribeInStories = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    tableStoriesContainer.innerHTML = `
                        <tr>
                            <td><div></div></td>
                            <td class="story-title"></td>
                            <td></td>
                            <td><span class="type-badge"></span></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td><ul><li></li></ul></td>
                            <td class="synopsis"></td>
                            <td>
                                <div class="action-buttons">
                                </div>
                            </td>
                        </tr>
                    `
                    return
                }

                snapshot.docChanges().forEach(change => {
                    const docId = change.doc.id

                    if (change.type === "added") {
                        const existingRow = tableStoriesContainer.querySelector(`tr[data-id="${docId}"]`)
                        if (!existingRow) {
                            AdminSectionStoriesFromDB(change.doc)
                        }
                    } 
                    else if (change.type === "modified") {
                        const row = tableStoriesContainer.querySelector(`tr[data-id="${docId}"]`)
                        if (row) updateStoryRow(row, change.doc)
                    } 
                    else if (change.type === "removed") {
                        const row = tableStoriesContainer.querySelector(`tr[data-id="${docId}"]`)
                        if (row) row.remove()
                    }
                })

                lastVisibleStories = snapshot.docs[snapshot.docs.length - 1]
            })
        }

let lastVisibleStories = null
let isFetchingInStories = false
let unsubscribeInStories = null

function fetchAllStories() {
    const storiesRef = collection(db, "stories")
    const q = query(storiesRef, orderBy("title", "asc"), limit(fetchPerBatch))

    // initial real-time batch
    AdminSectionFetchInRealTimeStoriesFromDB(q)

    // scroll event for next batches
    const storiesTableWrapper = document.querySelector(".stories-table-wrapper")

    let lastScrollTop = 0

    storiesTableWrapper.addEventListener("scroll", async (e) => {
        const currentScrollTop = e.target.scrollTop

        // only trigger if user scrolled vertically
        if (currentScrollTop !== lastScrollTop) {
            const nearBottom =
                storiesTableWrapper.scrollTop + storiesTableWrapper.clientHeight >=
                storiesTableWrapper.scrollHeight - 50

            if (nearBottom && !isFetchingInStories && lastVisibleStories) {
                isFetchingInStories = true
                await loadMoreStories()
                isFetchingInStories = false
            }
        }
        lastScrollTop = currentScrollTop
    })
}

async function loadMoreStories() {
    const storiesRef = collection(db, "stories")
    const nextQuery = query(
        storiesRef,
        orderBy("title", "asc"),
        startAfter(lastVisibleStories),
        limit(fetchPerBatch)
    )

    console.log("FETCHING")

    const snapshot = await getDocs(nextQuery)

    // 🔹 Kapag walang laman ang next batch
    if (snapshot.empty) {
        return false
    } else {
        AdminSectionFetchInRealTimeStoriesFromDB(nextQuery)
    }
}

        
// Event handler for Save
function handleSave() {
    saveChanges(currentStoryIdForSave)
}

// Event handler for Cancel
function handleCancel() {
    closeEditForm()
}

// openEditForm function
function openEditForm(storyId) {
    currentEditingStoryId = storyId
    const currentRow = document.querySelector(`tr[data-id="${currentEditingStoryId}"]`)
    const modal = document.getElementById('editModal')
    
    // Get current values from the row
    const title = currentRow.querySelector('.story-title').textContent
    const author = currentRow.cells[2].textContent
    const type = currentRow.querySelector('.type-badge').textContent.toLowerCase()
    const views = currentRow.cells[5].textContent
    const language = currentRow.cells[6].textContent
    const genres = getGenres(currentRow)
    const synopsis = currentRow.querySelector('.synopsis').textContent
    
    // Populate form fields
    document.getElementById('editTitle').value = title
    document.getElementById('editAuthor').value = author
    document.getElementById('editType').value = type
    document.getElementById('editViews').value = views
    document.getElementById('editLanguage').value = language
    document.getElementById('editGenre').value = genres
    choice.setChoiceByValue(genres)
    document.getElementById('editSynopsis').value = synopsis

    // Set the current Story ID for saving
    currentStoryIdForSave = storyId

    // Show modal
    modal.classList.add('active')
    
    // Remove any previous event listeners to avoid duplicates
    saveBtn.removeEventListener('click', handleSave)
    saveBtn.addEventListener('click', handleSave)

    cancelBtn.removeEventListener('click', handleCancel)
    cancelBtn.addEventListener('click', handleCancel)
}

// Close edit form
function closeEditForm() {
    const modal = document.getElementById('editModal')
    modal.classList.remove('active')
    
    // Reset the form fields
    document.getElementById('editTitle').value = ''
    document.getElementById('editAuthor').value = ''
    document.getElementById('editType').value = ''
    document.getElementById('editViews').value = ''
    document.getElementById('editLanguage').value = ''
    document.getElementById('editSynopsis').value = ''
    document.getElementById('editGenre').selectedIndex = -1

    choice.removeActiveItems()
    
    currentEditingStoryId = null
    currentStoryIdForSave = null // Reset the saved Story ID reference
    saveBtn.removeEventListener('click', handleSave) // Remove the save listener to avoid duplicates
}

// Save changes 
async function saveChanges(storyId) {

    if (popUpCheckTimeout) {
        clearTimeout(popUpCheckTimeout)
        popUpCheckTimeout = null  // Reset the timer
        popUp.style.display = "none"
        popUp.innerHTML = ""
    }

    popUp.innerHTML = `
            <div class="popup-card">
                <div class="spinner"></div>
            </div>
        `
    popUp.style.display = "flex"

    popUpCheckTimeout = setTimeout(() => {
            popUp.style.display = "none"
            popUp.innerHTML = ""
    }, 1000)

    // Get new values from form
    const title = document.getElementById('editTitle').value
    const author = document.getElementById('editAuthor').value
    const type = document.getElementById('editType').value
    const views = document.getElementById('editViews').value
    const language = document.getElementById('editLanguage').value
    const genreSelect = document.getElementById('editGenre')
    const selectedGenres = Array.from(genreSelect.selectedOptions).map(option => option.value)
    const genre = selectedGenres
    
    const synopsis = document.getElementById('editSynopsis').value
    
    const storyRef = doc(db, 'stories', storyId)

    try {
        await updateDoc(storyRef, {
        title: title,
        author: author,
        genre: genre,
        type: type,
        language: language,
        synopsis: synopsis,
        views: views
    })

        console.log("Story updated successfully!")

        closeEditForm()
    } catch (error) {
        console.error("Error updating document: ", error)
    }
}

function deleteStoryPopUp(docId) {
      // Make sure docId is not empty
    popUp.innerHTML = `
        <div class="popup-card" data-id="${docId}">

            <!-- Popup Heading -->
            <h2 class="popup-heading">Delete Story</h2>

            <!-- Popup Message -->
            <p class="popup-message">
                Are you sure you want to delete this story? This action cannot be undone.
            </p>

            <!-- Action Buttons -->
            <div class="popup-actions">
                <button class="btn btn-cancel">
                Cancel
                </button>
                <button class="btn btn-delete">
                Delete Story
                </button>
            </div>

        </div>
    `
    popUp.style.display = "flex"

    const deleteStoryBtn = popUp.querySelector(".btn-delete")
    deleteStoryBtn.addEventListener("click", () => {
        deleteStoryDoc(docId)
    })

    const cancelBtn = popUp.querySelector(".btn-cancel")
    cancelBtn.addEventListener("click", () => {
        removeDeletePopup()
    })
}

async function deleteStoryDoc(storyId) {
    const storyRef = doc(db, 'stories', storyId)

    if (popUpCheckTimeout) {
        clearTimeout(popUpCheckTimeout)
        popUpCheckTimeout = null  // Reset the timer
        popUp.style.display = "none"
        popUp.innerHTML = ""
    }

    const popUpCard = popUp.querySelector(`[data-id="${storyId}"]`)
    popUpCard.innerHTML = `
        <div class="spinner"></div>
    `

    popUp.style.display = "flex"

    popUpCheckTimeout = setTimeout(() => {
            popUp.style.display = "none"
            popUp.innerHTML = ""
    }, 3000)

    try {

        const usersRef = collection(db, "users")
        const usersSnap = await getDocs(usersRef)

        // 1 Loop all users
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data()
            const userRef = doc(db, "users", userDoc.id)

            let updates = {}

            // ✅ Remove from viewStory (array)
            if (Array.isArray(userData.viewStory)) {
                const filtered = userData.viewStory.filter(
                    id => id !== storyId
                )

                if (filtered.length !== userData.viewStory.length) {
                    updates.viewStory = filtered
                }
            }

            // ✅ Remove from yourStory (array)
            if (Array.isArray(userData.yourStory)) {
                const filtered = userData.yourStory.filter(
                    id => id !== storyId
                )

                if (filtered.length !== userData.yourStory.length) {
                    updates.yourStory = filtered
                }
            }

            // ✅ Remove from readingStory (map/object)
            if (userData.readingStory && typeof userData.readingStory === "object") {
                if (userData.readingStory[storyId]) {
                    const updatedReading = { ...userData.readingStory }
                    delete updatedReading[storyId]
                    updates.readingStory = updatedReading
                }
            }

            // 🔥 Only update if may nabago
            if (Object.keys(updates).length > 0) {
                await updateDoc(userRef, updates)
            }
        }

        console.log("✅ Story removed from all users successfully.")


        // 2 Get the story document
        const storySnap = await getDoc(storyRef)
        
        if (!storySnap.exists()) {
            console.log("Story not found!")

            if (popUpCheckTimeout) {
                clearTimeout(popUpCheckTimeout)
                popUpCheckTimeout = null  // Reset the timer
                popUp.style.display = "none"
                popUp.innerHTML = ""
            }

            return
        }

        

        const storyData = storySnap.data()
        const pageCount = storyData.pageCount || 0

        console.log(`Deleting ${pageCount} pages for story ${storyId}...`)

        // 3 Delete each page subcollection
        for (let i = 1; i <= pageCount; i++) {
            const pageName = `page${i}`
            const pageColRef = collection(storyRef, pageName)
            const snapshot = await getDocs(pageColRef)

            for (const docSnap of snapshot.docs) {
                await deleteDoc(docSnap.ref)
            }

            console.log(`Deleted all docs in ${pageName}`)
        }

        // 4 Delete the story document itself
        await deleteDoc(storyRef)

        console.log("Story and all pages deleted successfully!")
    } catch (error) {
        console.error("Error deleting story: ", error)
    }
}


        // Add a new page to the form
        function addPage() {
            const pageId = pageCount
            pageCount++
            
            const pagesContainer = document.getElementById('pagesContainer')
            
            const pageCard = document.createElement('div')
            pageCard.className = 'page-card'
            pageCard.setAttribute('data-page-id', pageId)
            pageCard.innerHTML = `
                <div class="page-card-header">
                    <h4>Page ${pageId}</h4>
                    <button type="button" class="remove-page-btn">Remove</button>
                </div>
                
                <div class="form-group">
                    <label>Page ID *</label>
                    <input type="number" class="page-id-input" value="${pageId}" required>
                </div>
                
                <div class="form-group">
                    <label>Body Content *</label>
                    <div class="body-builder" data-page-id="${pageId}"></div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button type="button" class="add-option-btn add-text-btn">+ Add Text</button>
                        <button type="button" class="add-option-btn  add-image-btn">+ Add Image</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Options (for interactive stories)</label>
                    <div class="options-builder" data-page-id="${pageId}"></div>
                    <button type="button" class="add-option-btn add-choices" >+ Add Option</button>
                </div>
            `;
            
            pagesContainer.appendChild(pageCard)
            
            // Initialize empty page data
            pages[pageId] = {
                id: pageId,
                body: [],
                options: []
            };

            // 👉 Attach remove button handler only to this new button
            const removeBtn = pageCard.querySelector(".remove-page-btn")
            removeBtn.addEventListener('click', function() {
                removePage(pageId)
            })

            const addTextBtn = pageCard.querySelector(".add-text-btn")
            addTextBtn.addEventListener('click', function() {
                addTextToBody(pageId)
            })

            const addImageBtn = pageCard.querySelector(".add-image-btn")
            addImageBtn.addEventListener('click', function() {
                addImageToBody(pageId)
            })

            const addOptionBtn = pageCard.querySelector(".add-choices")
            addOptionBtn.addEventListener('click', function() {
                addOption(pageId)
            })

            console.log(pages.length)
        }

        function removePage(pageId) {
            const pageCard = document.querySelector(`[data-page-id="${pageId}"]`)
            if (pageCard) {
                pageCard.remove()
                delete pages[pageId]
            }
        }

        // Add text block to body
        function addTextToBody(pageId) {
            const bodyBuilder = document.querySelector(`.body-builder[data-page-id="${pageId}"]`)
            const textIndex = bodyBuilder.children.length
            
            const textBlock = document.createElement('div')
            textBlock.className = 'body-block'
            textBlock.setAttribute('data-type', 'text')
            textBlock.setAttribute('data-index', textIndex)
            textBlock.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>Text Block</strong>
                    <button type="button" class="remove-option-btn">Remove</button>
                </div>
                <textarea class="body-text-input" rows="3" placeholder="Enter story text..."></textarea>
            `
            
            bodyBuilder.appendChild(textBlock)
            
            // Add to page data
            pages[pageId].body.push({ type: 'text', value: '' })

            const removeBodyBtn = textBlock.querySelector(".remove-option-btn")
            removeBodyBtn.addEventListener('click', function() {
                // Kunin ang CURRENT index sa DOM, hindi yung old textIndex
                const currentIndex = parseInt(textBlock.getAttribute('data-index'))
                removeBodyBlock(pageId, currentIndex)
            })

            const updateBodyTextInput = textBlock.querySelector(".body-text-input")
            updateBodyTextInput.addEventListener('change', function() {
                updateBodyData(pageId)
            })
        }

        // Add image block to body
        function addImageToBody(pageId) {
            const bodyBuilder = document.querySelector(`.body-builder[data-page-id="${pageId}"]`)
            const imageIndex = bodyBuilder.children.length
            
            const imageBlock = document.createElement('div')
            imageBlock.className = 'body-block'
            imageBlock.setAttribute('data-type', 'image')
            imageBlock.setAttribute('data-index', imageIndex)
            imageBlock.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>Image Block</strong>
                    <button type="button" class="remove-option-btn">Remove</button>
                </div>
                <input type="file" class="body-image-input" accept="image/*">
                <div class="image-preview" style="margin-top: 0.5rem;"></div>
            `
            
            bodyBuilder.appendChild(imageBlock)
            
            // Add to page data
            pages[pageId].body.push({ type: 'image', value: '' })

            const removeBodyBtn = imageBlock.querySelector(".remove-option-btn")
            removeBodyBtn.addEventListener('click', function() {
                // Kunin ang CURRENT index sa DOM, hindi yung old textIndex
                const currentIndex = parseInt(imageBlock.getAttribute('data-index'))
                removeBodyBlock(pageId, currentIndex)
            })

            const UpdateImageBodyInput = imageBlock.querySelector(".body-image-input")
            UpdateImageBodyInput.addEventListener('change', function() {
                // Kunin ang CURRENT index sa DOM, hindi yung old textIndex
                const currentIndex = parseInt(imageBlock.getAttribute('data-index'))
                handleImagePreview(pageId, currentIndex, this)
            })
        }

        // Remove body block
        function removeBodyBlock(pageId, index) {
            const bodyBuilder = document.querySelector(`.body-builder[data-page-id="${pageId}"]`)
            const block = bodyBuilder.querySelector(`[data-index="${index}"]`)
            if (block) {
                block.remove()
                pages[pageId].body.splice(index, 1)
                
                // Re-index remaining blocks
                const blocks = bodyBuilder.querySelectorAll('.body-block')
                blocks.forEach((block, idx) => {
                    block.setAttribute('data-index', idx)
                })
            }
        }

        // Update body data when text changes
        function updateBodyData(pageId) {
            const bodyBuilder = document.querySelector(`.body-builder[data-page-id="${pageId}"]`)
            const blocks = bodyBuilder.querySelectorAll('.body-block')
            
            blocks.forEach((block, index) => {
                const type = block.getAttribute('data-type')
                if (type === 'text') {
                    const textarea = block.querySelector('.body-text-input')
                    pages[pageId].body[index].value = textarea.value
                }
            })
        }

        // Handle image preview
        function handleImagePreview(pageId, index, input) {
            const file = input.files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = function(e) {
                    const preview = input.nextElementSibling
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; border-radius: 8px; border: 2px solid #e0e0e0;">`
                    
                    // Store file temporarily
                    pages[pageId].body[index].file = file
                    pages[pageId].body[index].preview = e.target.result
                };
                reader.readAsDataURL(file)
            }
        }

        // Add option to page
        function addOption(pageId) {
            const optionsBuilder = document.querySelector(`.options-builder[data-page-id="${pageId}"]`)
            const optionIndex = optionsBuilder.children.length
            
            const optionBlock = document.createElement('div')
            optionBlock.className = 'option-input'
            optionBlock.setAttribute('data-index', optionIndex)
            optionBlock.innerHTML = `
                <input type="text" placeholder="Option label" class="option-label">
                <input type="number" placeholder="Next page ID" class="option-next-page">
                <button type="button" class="remove-option-btn" >×</button>
            `
            
            optionsBuilder.appendChild(optionBlock)

            // Add to page data
            pages[pageId].options.push({ label: '', nextPage: null })

            const removeOptionBtn = optionBlock.querySelector(".remove-option-btn")
            removeOptionBtn.addEventListener('click', function() {
                // Kunin ang CURRENT index sa DOM, hindi yung old textIndex
                const currentIndex = parseInt(optionBlock.getAttribute('data-index'))
                removeOption(pageId, currentIndex)
            })

            const optionInputLabelEl = optionBlock.querySelector(".option-label")
            optionInputLabelEl.addEventListener('change', function() {
                updateOptionData(pageId)
            })

            const optionInputNextPageEl = optionBlock.querySelector(".option-next-page")
            optionInputNextPageEl.addEventListener('change', function() {
                updateOptionData(pageId)
            })
        }

                // Remove option
        function removeOption(pageId, index) {
            const optionsBuilder = document.querySelector(`.options-builder[data-page-id="${pageId}"]`)
            const option = optionsBuilder.querySelector(`[data-index="${index}"]`)
            if (option) {
                option.remove()
                pages[pageId].options.splice(index, 1)

                // Re-index remaining options
                const options = optionsBuilder.querySelectorAll('.option-input')
                options.forEach((option, idx) => {
                    option.setAttribute('data-index', idx)
                })
            }
        }

        // Update option data
        function updateOptionData(pageId) {
            const optionsBuilder = document.querySelector(`.options-builder[data-page-id="${pageId}"]`)
            const options = optionsBuilder.querySelectorAll('.option-input')
            
            options.forEach((option, index) => {
                const label = option.querySelector('.option-label').value
                const nextPage = option.querySelector('.option-next-page').value
                
                pages[pageId].options[index] = {
                    label: label,
                    nextPage: nextPage ? parseInt(nextPage) : null
                }
            })
        }

        // Reset upload form
        function resetUploadForm() {
            document.getElementById('uploadForm').reset()
            document.getElementById('pagesContainer').innerHTML = ''
            pageCount = 1
            pages = []
            const statusDiv = document.getElementById('uploadStatus')
            statusDiv.className = 'upload-status'
            statusDiv.style.display = 'none'
            console.log("Reset")
        }


        // Upload image to Cloudinary
        async function uploadToCloudinary(file) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            return data.secure_url
        }

        // Handle form submission
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const statusDiv = document.getElementById('uploadStatus')
            statusDiv.className = 'upload-status loading'
            statusDiv.textContent = 'Uploading story...'

            try {

                // Get form values
                const title = document.getElementById('storyTitle').value
                const author = document.getElementById('storyAuthor').value
                const authorUid = document.getElementById('storyAuthorUid').value
                const genreSelect = document.getElementById('storyGenre')
                const selectedGenres = Array.from(genreSelect.selectedOptions).map(option => option.value)
                const genre = selectedGenres
                const type = document.getElementById('storyType').value
                const language = document.getElementById('storyLanguage').value
                const synopsis = document.getElementById('storySynopsis').value
                const coverFile = document.getElementById('coverPhoto').files[0]
                const pageCounts = pages.length

                // Upload cover photo to Cloudinary
                statusDiv.textContent = 'Uploading cover photo...'
                const coverUrl = await uploadToCloudinary(coverFile)

                // Create story document in Firestore
                statusDiv.textContent = 'Creating story document...'
                const storyRef = await addDoc(collection(db, 'stories'), {
                    title: title,
                    author: author,
                    authorUID: authorUid,
                    genre: genre,
                    type: type,
                    language: language,
                    synopsis: synopsis,
                    coverUrl: coverUrl,
                    views: 0,
                    uploadedAt: serverTimestamp(),
                    pageCount: pageCounts
                })

                const storyId = storyRef.id
                console.log("Story Created ID:", storyId)

                // Reference to user document
                const userRef = doc(db, 'users', authorUid)

                // Save storyId inside yourStory array
                await setDoc(userRef, {
                    yourStory: arrayUnion(storyId)
                }, { merge: true })

                console.log("Story ID saved to user document")

                // Process and upload pages
                statusDiv.textContent = 'Uploading story pages...'
                
                for (const page of pages) {
                    if (!page) continue // Skip deleted pages
                    
                    // Update all body text data
                    updateBodyData(page.id)
                    updateOptionData(page.id)
                    
                    // Upload images in body
                    const processedBody = [];
                    for (const bodyItem of page.body) {
                        if (bodyItem.type === 'text') {
                            processedBody.push({
                                type: 'text',
                                value: bodyItem.value
                            });
                        } else if (bodyItem.type === 'image' && bodyItem.file) {
                            statusDiv.textContent = `Uploading images for page ${page.id}...`
                            const imageUrl = await uploadToCloudinary(bodyItem.file);
                            processedBody.push({
                                type: 'image',
                                value: imageUrl
                            });
                        }
                    }
                    
                    // Get page ID from input
                    const pageCard = document.querySelector(`[data-page-id="${page.id}"]`)
                    const pageIdInput = pageCard.querySelector('.page-id-input').value
                    const pageNumber = parseInt(pageIdInput)

                    // Add page document to subcollection
                    // ✅ Correct way to set page in subcollection
                    const pageDocRef = doc(collection(storyRef, `page${pageNumber}`), `${pageNumber}`)
                    await setDoc(pageDocRef, {
                        id: pageNumber,
                        body: processedBody,
                        options: page.options
                    })
                }

                // Success
                statusDiv.className = 'upload-status success'
                statusDiv.textContent = 'Story uploaded successfully!'
                
                // Reset form after 2 seconds
                setTimeout(() => {
                    resetUploadForm();
                    statusDiv.style.display = 'none'
                }, 2000)

            } catch (error) {
                console.error('Error uploading story:', error)
                statusDiv.className = 'upload-status error'
                statusDiv.textContent = 'Error uploading story: ' + error.message
            }
        })

        async function fetchCurrentAdminDeatils(user) {
            const currentUserDoc = await getDoc(doc(db, "admins", user.uid))
            if (!currentUserDoc.exists()) {
                console.error("Current user not found in admins collection")
                return
            }

            const userData = currentUserDoc.data()

            proFileDetailsContainer.innerHTML = `
                <h4>Admin User</h4>
                <p class="profile-email">${userData.email}</p>
                <span class="role-badge">${toTitleCase(userData.role)}</span>
            `
        }






        async function onStatusChange(newStatus, userId, url) {
            console.log("Status changed to:", newStatus)

            // Reference to the user's document
            const userRef = doc(db, "users", userId)

            // Get the user document
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                console.error("User not found!")
                return
            }

            const userData = userSnap.data()

            if (Array.isArray(userData.inQueueStory)) {
                // Map over the array to update the matching url
                const updatedQueue = userData.inQueueStory.map(item => {
                    if (item.url === url) {
                        return { ...item, status: newStatus } // update status
                    }
                    return item // keep as is
                })

                // Update the document in Firestore
                await updateDoc(userRef, { inQueueStory: updatedQueue })

                console.log("Status updated successfully!")
            } else {
                console.error("inQueueStory is not an array!")
            }
        }

        async function fetchAllFiles() {
            const usersRef = collection(db, "users")
            const querySnapshot = await getDocs(usersRef)

            let allFiles = []

            querySnapshot.forEach(userDoc => {
                const userData = userDoc.data()
                const accountName = userData.email || "Anonymous"

                if (Array.isArray(userData.inQueueStory)) {
                    userData.inQueueStory.forEach(file => {
                        allFiles.push({
                            userId: userDoc.id,
                            account: accountName,
                            name: file.name,
                            url: file.url,
                            date: file.uploadedAt,
                            status: file.status
                        })
                    })
                }
            })

            return allFiles
        }

        function renderFiles(files) {
            const awaitingContainer = document.getElementById("awaiting")
            const failedContainer = document.getElementById("failed")
            const verifiedContainer = document.getElementById("verified")

            // Clear previous content
            awaitingContainer.innerHTML = ""
            failedContainer.innerHTML = ""
            verifiedContainer.innerHTML = ""

            files.forEach(file => {
                let container

                if (file.status === "waiting") {
                    container = awaitingContainer
                } 
                else if (file.status === "failed") {
                    container = failedContainer
                } 
                else if (file.status === "verified") {
                    container = verifiedContainer
                } 
                else {
                    container = awaitingContainer
                }

                const fileList = document.createElement("div")
                fileList.className = "files-list"

                const fileCard = document.createElement("div")
                fileCard.className = "file-card"

                const fileHeader = document.createElement("div")
                fileHeader.className = "file-header"

                const fileDetails = document.createElement("div")
                fileDetails.className = "file-details"

                fileHeader.innerHTML = `
                    <select class="status-select">
                        <option value="verified">Verified</option>
                        <option value="waiting">Waiting</option>
                        <option value="failed">Failed</option>
                    </select>

                    <span class="status-badge">Delete</span>
                `

                fileDetails.innerHTML = `
                    <a href="${file.url}" target="_blank" class="file-link">
                        <h3 class="file-name">${file.name}</h3>
                    </a>
                    <div class="file-meta">
                        <span class="meta-item">👤 ${file.account}</span>
                        <span class="meta-item">📅 ${formatDate2(file.date)}</span>
                    </div>
                    <div class="uid-container">
                        <label class="uid-label">Uploader UID:</label>
                        <code class="uid-code">${file.userId}</code>
                        <button class="copy-btn" data-id="${file.userId}">Copy</button>
                        <p class="uid-note">💡 Copy this UID and paste it into the UID field when uploading.</p>
                    </div>
                `

                fileCard.appendChild(fileHeader)
                fileCard.appendChild(fileDetails)
                fileList.appendChild(fileCard)
                container.appendChild(fileList)




                const selected = file.status
                const select = fileHeader.querySelector(".status-select")

                // declare ang selected value
                select.value = selected

                const statusSelect = fileHeader.querySelector(".status-select")
                const updateColor = () => {
                    switch (statusSelect.value) {
                        case "verified":
                            statusSelect.style.backgroundColor = "#d1fae5"
                            statusSelect.style.color = "#065f46"
                            break
                        case "waiting":
                            statusSelect.style.backgroundColor = "#fef3c7"
                            select.style.color = "#92400e"
                            break
                        case "failed":
                            statusSelect.style.backgroundColor = "#fee2e2"
                            statusSelect.style.color = "#991b1b"
                            break
                    }
                }

                // Initial color
                updateColor()

                // On change
                statusSelect.addEventListener("change", () => {
                    updateColor()           
                    onStatusChange(statusSelect.value, file.userId, file.url)
                })



                const deleteBtn = fileHeader.querySelector(".status-badge")
                deleteBtn.addEventListener("click", () => {
                    deleteFilesPopUp(file.userId, file.url)
                })



                const copyBtn = fileDetails.querySelector(".copy-btn")
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard.writeText(file.userId)
                    .then(() => {
                        copyBtn.textContent = "Copied!"
                        
                        setTimeout(() => {
                            copyBtn.textContent = "Copy"
                        }, 1500)
                    })
                    .catch(err => {
                        console.error("Failed to copy:", err)
                    })
                        })
            })
        }




        function deleteFilesPopUp(userId, url) {
        // Make sure docId is not empty
            popUp.innerHTML = `
                <div class="popup-card" data-id="${userId}">

                    <!-- Popup Heading -->
                    <h2 class="popup-heading">Delete File</h2>

                    <!-- Popup Message -->
                    <p class="popup-message">
                        Are you sure you want to delete this file? This action cannot be undone.
                    </p>

                    <!-- Action Buttons -->
                    <div class="popup-actions">
                        <button class="btn btn-cancel">
                        Cancel
                        </button>
                        <button class="btn btn-delete">
                        Delete User
                        </button>
                    </div>

                </div>
            `
            popUp.style.display = "flex"

            const deleteUserBtn = popUp.querySelector(".btn-delete")
            deleteUserBtn.addEventListener("click", () => {
                deleteFile(userId, url)
            })

            const cancelBtn = popUp.querySelector(".btn-cancel")
            cancelBtn.addEventListener("click", () => {
                removeDeletePopup()
            })
        }

        async function deleteFile(userId, url) {
            const userRef = doc(db, "users", userId)

            try {

                if (popUpCheckTimeout) {
                    clearTimeout(popUpCheckTimeout)
                    popUpCheckTimeout = null  // Reset the timer
                    popUp.style.display = "none"
                    popUp.innerHTML = ""
                }

                const popUpCard = popUp.querySelector(`[data-id="${userId}"]`)
                popUpCard.innerHTML = `
                    <div class="spinner"></div>
                `

                popUp.style.display = "flex"

                popUpCheckTimeout = setTimeout(() => {
                    popUp.style.display = "none"
                    popUp.innerHTML = ""
                }, 3000)
                            
                const userSnap = await getDoc(userRef)

                if (!userSnap.exists()) {
                    throw new Error("User not found")
                }

                const userData = userSnap.data()
                const inQueue = userData.inQueueStory || []

                // Find file object
                const fileToDelete = inQueue.find(item => item.url === url)

                if (!fileToDelete) {
                    throw new Error("File not found in user document")
                }

                // Extract file path from Supabase public URL
                const filePath = url.split("/storage/v1/object/public/file-uploads/")[1]

                if (!filePath) {
                    throw new Error("Invalid file path")
                }

                // 1️⃣ DELETE FROM SUPABASE FIRST
                const { error: storageError } = await supabase
                .storage
                .from("file-uploads")
                .remove([filePath])

                if (storageError) {
                    throw new Error("Storage delete failed")
                }

                // 2️⃣ UPDATE FIRESTORE
                const updatedQueue = inQueue.filter(item => item.url !== url)

                await updateDoc(userRef, {
                    inQueueStory: updatedQueue
                })

                console.log("✅ File and reference deleted safely")
            } catch (error) {
                console.error("❌ Delete failed:", error.message)
                removeDeletePopup()
            }
        }





        async function loadFiles() {
            const files = await fetchAllFiles()

            files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            renderFiles(files)
        }

        function formatDate2(dateString) {
            const date = new Date(dateString)

            const month = String(date.getMonth() + 1).padStart(2)
            const day = String(date.getDate()).padStart(2)
            const year = String(date.getFullYear()).slice(-2)

            return `${month}/${day}/${year}`
        }

        loadFiles()







    async function fetchAllComments() {
        const usersRef = collection(db, "users")
        const querySnapshot = await getDocs(usersRef)

        let allComments = []

        querySnapshot.forEach(userDoc => {
            const userData = userDoc.data()
            const accountName = userData.email || "Anonymous"

            if (Array.isArray(userData.sharedIdeas)) {
                userData.sharedIdeas.forEach(idea => {
                    allComments.push({
                        userId: userDoc.id,
                        account: accountName,
                        text: idea.idea,
                        createdAt: idea.createdAt
                    })
                })
            }
        })

        return allComments
    }

    function renderComments(comments) {
        const wrapper = document.querySelector(".comments-wrapper")

        wrapper.querySelectorAll(".comment-card").forEach(el => el.remove())

        comments.forEach(comment => {
            const card = document.createElement("div")
            card.className = "comment-card"

            const date = comment.createdAt?.toDate
            ? comment.createdAt.toDate().toLocaleDateString()
            : "Unknown date"


            card.innerHTML = `
                <div class="comment-header">
                    <div class="comment-user">
                        <strong class="account-name">${comment.account}</strong>
                        <span class="comment-date">
                            ${date}
                        </span>
                    </div>
                    <button class="delete-link">Delete</button>
                </div>
                <p class="comment-text">${comment.text}</p>
            `

            // ALWAYS attach delete handler
            card.querySelector(".delete-link").addEventListener("click", async (e) => {
                e.preventDefault()

                const confirmDelete = confirm("Delete this comment?")
                if (!confirmDelete) return

                await deleteComment(comment)
                loadComments()
            })

            wrapper.appendChild(card)
        })
    }

    async function deleteComment(comment) {
        const userDocRef = doc(db, "users", comment.userId)

        try {
            await updateDoc(userDocRef, {
                sharedIdeas: arrayRemove({
                    idea: comment.text,
                    createdAt: comment.createdAt
                })
            })
        } catch (error) {
            console.error("Error deleting comment:", error)
        }
    }

    async function loadComments() {
        const comments = await fetchAllComments()

        comments.sort((a, b) => b.createdAt - a.createdAt)

        document.querySelector(".feedback-count").textContent =
            `${comments.length} comments`

        renderComments(comments)
    }

loadComments()





// Function to create a new admin user and handle session management
async function createAdminUser(email, password) {
    try {
        // Get the UID of the current logged-in user (superadmin)
        const currentUserUid = auth.currentUser.uid
        const superadminCredentials = await getSuperadminCredentials(currentUserUid)
        console.log("Superadmin UID:", currentUserUid)

        // Check if the logged-in user is a superadmin
        const isSuperAdmin = await checkIfSuperAdmin(currentUserUid)
        if (!isSuperAdmin) {
            throw new Error("You don't have the required permissions.")
        }

        // Create the new admin user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        console.log("New Admin UID:", user.uid)

        // Log out the newly created admin user to prevent them from being logged in
        await signOut(auth)
        console.log("New admin logged out immediately after creation.")

        // Log in the superadmin again to maintain the session
        await loginAsSuperAdmin(superadminCredentials)
        console.log("Superadmin logged back in.")

        return user.uid; // Returning the UID of the new admin
    } catch (error) {
        console.error("Error creating admin user:", error)
        throw error
    }
}

// Function to check if the current user is a superadmin
async function checkIfSuperAdmin(uid) {
    try {
        const adminDocRef = doc(db, "admins", uid)
        const adminDoc = await getDoc(adminDocRef)

        if (adminDoc.exists() && adminDoc.data().role === "superadmin") {
            return true
        } else {
            return false
        }
    } catch (error) {
        console.error("Error checking superadmin status:", error)
        throw error
    }
}

// Function to create a document for the newly created admin
async function createAdminDoc(uid, name, email, role, password) {
    try {
        await setDoc(doc(db, "admins", uid), {
            name: name,
            email: email,
            password: password,
            role: role,
            createdAt: serverTimestamp()
        })
        console.log("Admin document created for UID:", uid)
    } catch (error) {
        console.error("Error creating admin document:", error)
        throw error
    }
}

// Function to check if the admin already exists in the Firestore database
async function isAdminExists(uid) {
    const adminDocRef = doc(db, "admins", uid)
    const adminDoc = await getDoc(adminDocRef)
    return adminDoc.exists()
}

// Function to log in the superadmin (the person who created the new admin)
async function loginAsSuperAdmin(superadminCredentials) {
    try {
        // Retrieve the superadmin credentials (assuming they're stored securely)

        // Log in using superadmin credentials
        await signInWithEmailAndPassword(auth, superadminCredentials.email, superadminCredentials.password)
        console.log("Superadmin logged in successfully.")
    } catch (error) {
        console.error("Error logging in as superadmin:", error)
        throw error
    }
}

// Function to retrieve superadmin credentials from Firestore (assuming this exists)
async function getSuperadminCredentials(uid) {
    const adminDocRef = doc(db, "admins", uid)
    const adminDoc = await getDoc(adminDocRef)

    if (!adminDoc.exists()) {
        throw new Error("Superadmin not found in Firestore.")
    }

    const adminData = adminDoc.data()
    return {
        email: adminData.email,
        password: adminData.password // Securely handle passwords in production
    }
}

// Form handling for creating a new admin user
const form = document.getElementById("create-admin-form")

form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("admin-name").value
    const email = document.getElementById("admin-email").value
    const password = document.getElementById("admin-password").value
    const role = document.getElementById("admin-role").value
    const submitButton = document.getElementById("submit-btn")

    // Basic validation for password length
    if (password.length < 6) {
        alert("Password must be at least 6 characters long.")
        return
    }

    submitButton.disabled = true
    submitButton.innerText = "Creating Admin..."

    try {
        const newAdminUid = await createAdminUser(email, password) // Step 1: Create Admin User
        const adminExists = await isAdminExists(newAdminUid)

        if (adminExists) {
            alert("This admin already exists!")
        } else {
            await createAdminDoc(newAdminUid, name, email, role, password) // Step 2: Create Admin Document
            alert("Admin successfully created!")
            form.reset()
        }
    } catch (error) {
        alert("Failed to create admin. Check console for details.")
    } finally {
        submitButton.disabled = false
        submitButton.innerText = "Create Admin"
    }
})

function addEventListener(user) {
    const signOutBtn = document.querySelector(".signout-btn")
    signOutBtn.addEventListener('click', async function() {
        signOut(auth)

        if (popUpCheckTimeout) {
            clearTimeout(popUpCheckTimeout)
            popUpCheckTimeout = null  // Reset the timer
            popUp.style.display = "none"
            popUp.innerHTML = ""
        }

        popUp.innerHTML = `
            <div class="popup-card">
                <div class="spinner"></div>
            </div>
        `
        popUp.style.display = "flex"

        popUpCheckTimeout = setTimeout(() => {
            popUp.style.display = "none"
            popUp.innerHTML = ``
        }, 4000)
    })
}


        function goToSavedSection() {
            if (activeNav === 'users') {
                goToUsers()
            } else if (activeNav === 'stories') {
                goToStories()
            } else if (activeNav === 'shared') {
                goToSharedFiles()
            } else if (activeNav === 'comments') {
                goToComments()  
            } else if (activeNav === 'settings') {
                goToSettings()
            } else {
                goToDashboard()
            }
        }

        function setActiveNavFromHash() {
            
            const currentHash = location.hash.replace('#', '') || 'dashboard'

            navLinks.forEach(link => {
                const spanText = link.textContent.toLowerCase()

                if (spanText === currentHash) {
                    link.classList.add("active")
                } else {
                    link.classList.remove("active")
                }
            })

        }

        function saveLastHashToLocalStorage() {
            localStorage.removeItem("activeNav")
            const currentHash = location.hash.replace('#', '') || 'dashboard'

            localStorage.setItem("activeNav", currentHash)
        }

        function resetScrollTop() {
            const currentSection = document.querySelector(".main-content")
            currentSection.scrollIntoView({ behavior: 'instant', block: 'start' })
        }

        function toTitleCase(str) {
        if (!str) return 'N/A'
        return str
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }

        function toLowerCase(str) {
        if (!str) return 'N/A' 
        return str.toLowerCase()
        }

        function formatDate(timestamp) {
            if (!timestamp || typeof timestamp.seconds !== 'number') return 'N/A'
            const date = new Date(timestamp.seconds * 1000)
            return date.toLocaleDateString()
        }


        function fetchUsersFromAdmin(users) {
            fetchAllUsers()
            fetchAllNormalAdmins(users)
        }

        function fetchStoriesFromAdmin() {
            fetchAllStories()
        }

        function fetchCurrentAdminDetails(user) {
            fetchCurrentAdminDeatils(user)
        }

        function getGenres(currentRow) {
            // Get the <ul> element from the 8th cell (index 7)
            const genreList = currentRow.cells[7].querySelectorAll('li');

            // Extract text from each <li> and store it in an array
            const genres = Array.from(genreList).map(li => li.textContent.trim());

            return genres; // Return an array of selected genres
        }


        const genreSelect = document.getElementById('storyGenre')
        const choices = new Choices(genreSelect, {
            removeItemButton: true, // allows users to remove selected genres
            placeholder: true,
            placeholderValue: 'Select genres',
            searchPlaceholderValue: 'Search genre...',
            maxItemCount: -1, // no limit
        })

        const editGenreSelect = document.getElementById('editGenre')
        const choice = new Choices(editGenreSelect, {
            removeItemButton: true, // allows users to remove selected genres
            placeholder: true,
            placeholderValue: 'Select genres',
            searchPlaceholderValue: 'Search genre...',
            maxItemCount: -1, // no limit
        })

        function theresLoginUser(user) {
            fetchDashBoardDatas()
            fetchStoriesFromAdmin()
            fetchUsersFromAdmin(user)
            addEventListener(user)
            fetchCurrentAdminDetails(user)
        }

        async function theresNoLoginUser() {
            window.location.href = "index.html"
        }





