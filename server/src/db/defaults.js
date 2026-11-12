const pool = require('./pool');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase' },
  { name: 'Freelance', type: 'income', color: '#06b6d4', icon: 'laptop' },
  { name: 'Investment', type: 'income', color: '#8b5cf6', icon: 'trending-up' },
  { name: 'Food & Dining', type: 'expense', color: '#f59e0b', icon: 'utensils' },
  { name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'car' },
  { name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'shopping-bag' },
  { name: 'Bills & Utilities', type: 'expense', color: '#ef4444', icon: 'zap' },
  { name: 'Entertainment', type: 'expense', color: '#f97316', icon: 'film' },
  { name: 'Health', type: 'expense', color: '#14b8a6', icon: 'heart' },
  { name: 'Education', type: 'expense', color: '#6366f1', icon: 'book' },
  { name: 'House Rent', type: 'expense', color: '#f97316', icon: 'home' },
];

const DEFAULT_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', color: '#10b981' },
  { code: 'EUR', name: 'Euro', symbol: '€', color: '#3b82f6' },
  { code: 'GBP', name: 'British Pound', symbol: '£', color: '#8b5cf6' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', color: '#f59e0b' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', color: '#ef4444' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', color: '#06b6d4' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', color: '#ec4899' },
];

const seedDefaultCategories = async (userId, db = pool) => {
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await db.query(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2',
      [userId, cat.name]
    );
    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO categories (user_id, name, type, color, icon) VALUES ($1, $2, $3, $4, $5)',
        [userId, cat.name, cat.type, cat.color, cat.icon]
      );
    }
  }
};

const seedDefaultCurrencies = async (userId, db = pool) => {
  for (const cur of DEFAULT_CURRENCIES) {
    await db.query(
      `INSERT INTO currencies (user_id, code, name, symbol, color)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, code) DO NOTHING`,
      [userId, cur.code, cur.name, cur.symbol, cur.color]
    );
  }
};

module.exports = {
  DEFAULT_CATEGORIES,
  DEFAULT_CURRENCIES,
  seedDefaultCategories,
  seedDefaultCurrencies,
};

