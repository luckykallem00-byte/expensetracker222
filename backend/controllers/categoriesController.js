const { admin } = require('../config/firebase');
const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }).trim(),
});

const defaultCategories = [
  'Food & Dining',
  'Rent',
  'Utilities',
  'Transport',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Other',
];

function getCategoriesRef(uid) {
  return admin.database().ref(`users/${uid}/categories`);
}

function normalizeCategoryList(snapshot) {
  const value = snapshot.val();
  if (!value) {
    return [];
  }
  return Object.entries(value).map(([id, category]) => ({ id, ...category }));
}

async function listCategories(req, res, next) {
  try {
    const snapshot = await getCategoriesRef(req.user.uid).once('value');
    const categories = normalizeCategoryList(snapshot);
    if (categories.length > 0) {
      return res.json({ data: categories });
    }

    const fallback = defaultCategories.map((name, index) => ({ id: `default-${index}`, name }));
    res.json({ data: fallback });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const parsed = categorySchema.parse(req.body);
    const newRef = await getCategoriesRef(req.user.uid).push();
    await newRef.set({
      name: parsed.name,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ id: newRef.key, name: parsed.name });
  } catch (error) {
    if (error instanceof Error && error.errors) {
      return res.status(400).json({ error: 'Invalid category payload', details: error.errors });
    }
    next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
};
