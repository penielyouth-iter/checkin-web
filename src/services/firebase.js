import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
import { firebaseConfig, dbEndpoints } from "../constants/FirebaseConfig"

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const database = getDatabase(app);

const familyDbRef = ref(database, dbEndpoints.FAMILIES)
const recordDbRef = ref(database, dbEndpoints.RECORDS)

export { familyDbRef, recordDbRef };
