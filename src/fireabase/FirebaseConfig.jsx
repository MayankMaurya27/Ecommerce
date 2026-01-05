// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkdF0Q7I3HCA8VerHenvuHXp6GID1zkVg",
  authDomain: "myfirstapp-9aef5.firebaseapp.com",
  projectId: "myfirstapp-9aef5",
  storageBucket: "myfirstapp-9aef5.firebasestorage.app",
  messagingSenderId: "441318402104",
  appId: "1:441318402104:web:1042591c000adeeb2adecd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const fireDB = getFirestore(app);
const auth = getAuth(app);

export {fireDB, auth}