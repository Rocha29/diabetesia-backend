const admin = require("firebase-admin");

const DAILY_LIMIT = parseInt(process.env.MAX_DAILY_REQUESTS || "200", 10);

let db;

function getDb() {
  if (!admin.apps.length) admin.initializeApp();
  if (!db) db = admin.firestore();
  return db;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

async function checkAndIncrement() {
  const ref = getDb().collection("usage_daily").doc(todayKey());

  const result = await getDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const count = doc.exists ? doc.data().count : 0;

    if (count >= DAILY_LIMIT) {
      return { allowed: false, used: count, limit: DAILY_LIMIT };
    }

    tx.set(ref, { count: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
    return { allowed: true, used: count + 1, limit: DAILY_LIMIT };
  });

  return result;
}

module.exports = { checkAndIncrement, DAILY_LIMIT };
