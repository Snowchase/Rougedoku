// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeVFJ2VXZXu5Qx697SmVCQm5tYLzEwSfQ",
  authDomain: "rougedoku.firebaseapp.com",
  projectId: "rougedoku",
  storageBucket: "rougedoku.firebasestorage.app",
  messagingSenderId: "39785848096",
  appId: "1:39785848096:web:956c4b905acc3823c38b45",
  measurementId: "G-T35EK3K0KN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);