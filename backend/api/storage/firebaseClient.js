let admin = null;
try {
  // firebase-admin не обязателен для локального хранения, поэтому подключаем по требованию
  admin = require("firebase-admin");
} catch (error) {
  admin = null;
}

let firestoreInstance = null;

const isFirebaseConfigured = () =>
  Boolean(
    admin &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );

const getFirebaseConfig = () => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
};

const getFirestore = () => {
  if (firestoreInstance) {
    return firestoreInstance;
  }
  const credentials = getFirebaseConfig();
  if (!admin) {
    throw new Error("firebase-admin is not installed. Install dependency or disable Firebase usage.");
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }
  firestoreInstance = admin.firestore();
  return firestoreInstance;
};

module.exports = {
  getFirestore,
  isFirebaseConfigured,
};
