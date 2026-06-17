const { admin } = require('../config/firebase');

function getExpensesRef(uid) {
  return admin.database().ref(`users/${uid}/expenses`);
}

function getMetaRef(uid) {
  return admin.database().ref(`users/${uid}/meta`);
}

function normalizeExpenseList(snapshot) {
  const value = snapshot.val();
  if (!value) {
    return [];
  }
  return Object.entries(value).map(([id, expense]) => ({ id, ...expense }));
}

async function getSummary(req, res, next) {
  try {
    const [expensesSnapshot, metaSnapshot] = await Promise.all([
      getExpensesRef(req.user.uid).once('value'),
      getMetaRef(req.user.uid).once('value'),
    ]);

    const expenses = normalizeExpenseList(expensesSnapshot);
    const meta = metaSnapshot.val() || {};
    const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalIncome = Number(meta.totalIncome || 0);
    const balance = totalIncome - totalExpense;

    const categories = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    const byCategory = Object.entries(categories).map(([category, amount]) => ({ category, amount }));

    res.json({
      totalIncome,
      totalExpense,
      balance,
      byCategory,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
};
