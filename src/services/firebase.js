import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

// const firebaseConfig = {
//     apiKey: "AIzaSyDXrWBpby0fWOtRqECpB9oNNr63IMpBJRU",
//     authDomain: "pycheckinapp-9ef89.firebaseapp.com",
//     databaseURL: "https://pycheckinapp-9ef89-default-rtdb.firebaseio.com",
//     projectId: "pycheckinapp-9ef89",
//     storageBucket: "pycheckinapp-9ef89.appspot.com",
//     messagingSenderId: "799541182145",
//     appId: "1:799541182145:web:63f425b0a5644e41dfde40",
// };

const firebaseConfig = {
    apiKey: "AIzaSyBSFZP2U-jkc-A1wUdjE4U-kD9-Ot0nufE",
    authDomain: "pycheckinweb.firebaseapp.com",
    databaseURL: "https://pycheckinweb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pycheckinweb",
    storageBucket: "pycheckinweb.firebasestorage.app",
    messagingSenderId: "433834278856",
    appId: "1:433834278856:web:2518c21b611b8165a60afd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const database = getDatabase(app);

const familyDbRef = ref(database, "peniel/families_dev")
const recordDbRef = ref(database, "peniel/weeklyrecords")

export { familyDbRef, recordDbRef };
