// Simple credit worker — reads transactions per user and writes a credit_profiles doc.
const { db } = require('../firebaseAdmin');

async function computeScore(uid: string) {
  const snap = await db.collection('users').doc(uid).collection('transactions').get();
  let income = 0, expenses = 0, repayments = 0, loans = 0;
  snap.docs.forEach((d: any) => {
    const t = d.data();
    if (['deposit', 'income'].includes(t.type)) income += Number(t.amount || 0);
    if (['withdrawal', 'expense'].includes(t.type)) expenses += Number(t.amount || 0);
    if (t.type === 'repayment') { repayments += Number(t.amount || 0); loans += 1; }
  });

  const savingsRate = income === 0 ? 0 : Math.max(0, (income - expenses) / income);
  const repaymentFactor = loans === 0 ? 0.5 : Math.min(1, repayments / (loans * 100));
  const score = Math.round(300 + (savingsRate * 400) + (repaymentFactor * 300));

  await db.collection('credit_profiles').doc(uid).set({
    uid, income, expenses, repayments, loans, score, updatedAt: new Date()
  }, { merge: true });

  return score;
}

async function run() {
  const users = await db.collection('users').listDocuments();
  for (const u of users) {
    try {
      const uid = u.id;
      const s = await computeScore(uid);
      console.log('Computed', uid, s);
    } catch (e) {
      console.error('Error for user', u.id, e);
    }
  }
  process.exit(0);
}

if (require.main === module) {
  run();
}

module.exports = { computeScore };