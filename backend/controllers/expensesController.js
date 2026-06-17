const { admin } = require('../config/firebase');
const { z } = require('zod');

const expenseSchema = z.object({
  amount: z.number().positive({ message: 'Amount must be greater than zero' }),
  category: z.string().min(1, { message: 'Category is required' }),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Date must be valid ISO date string' }),
  note: z.string().optional(),
});

const filterSchema = z.object({
  category: z.string().min(1).optional(),
  startDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'startDate must be valid' }).optional(),
  endDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'endDate must be valid' }).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, { message: 'startDate must be before or equal to endDate' });

function getUserExpensesRef(uid) {
  return admin.database().ref(`users/${uid}/expenses`);
}

function normalizeExpenseList(snapshot) {
  const value = snapshot.val();
  if (!value) {
    return [];
  }

  return Object.entries(value).map(([id, expense]) => ({ id, ...expense }));
}

async function listExpenses(req, res, next) {
  try {
    const { category, startDate, endDate } = filterSchema.parse(req.query);
    const snapshot = await getUserExpensesRef(req.user.uid).once('value');
    let expenses = normalizeExpenseList(snapshot);

    if (category) {
      expenses = expenses.filter((expense) => expense.category === category);
    }
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      expenses = expenses.filter((expense) => new Date(expense.date).setHours(0, 0, 0, 0) >= start);
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      expenses = expenses.filter((expense) => new Date(expense.date).getTime() <= end);
    }

    res.json({ data: expenses });
  } catch (error) {
    if (error instanceof Error && error.errors) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const parsed = expenseSchema.parse({
      amount: Number(req.body.amount),
      category: req.body.category,
      date: req.body.date,
      note: req.body.note?.trim(),
    });

    const newRef = await getUserExpensesRef(req.user.uid).push();
    await newRef.set({
      ...parsed,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ id: newRef.key, ...parsed });
  } catch (error) {
    if (error instanceof Error && error.errors) {
      return res.status(400).json({ error: 'Invalid expense payload', details: error.errors });
    }
    next(error);
  }
}

async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Expense id is required' });
    }

    const parsed = expenseSchema.parse({
      amount: Number(req.body.amount),
      category: req.body.category,
      date: req.body.date,
      note: req.body.note?.trim(),
    });

    const expenseRef = getUserExpensesRef(req.user.uid).child(id);
    const snapshot = await expenseRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expenseRef.update({
      ...parsed,
      updatedAt: new Date().toISOString(),
    });

    res.json({ id, ...parsed });
  } catch (error) {
    if (error instanceof Error && error.errors) {
      return res.status(400).json({ error: 'Invalid expense payload', details: error.errors });
    }
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Expense id is required' });
    }

    const expenseRef = getUserExpensesRef(req.user.uid).child(id);
    const snapshot = await expenseRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await expenseRef.remove();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
