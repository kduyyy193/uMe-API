const admin = require("firebase-admin");
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
// Kiểm tra kết nối Firebase
db.ref(".info/connected").on("value", (snapshot) => {
  if (snapshot.val() === true) {
    console.log("Firebase connected successfully.");
  } else {
    console.log("Firebase not connected.");
  }
});

module.exports = db;
