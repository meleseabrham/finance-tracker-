const pool = require('../db/pool');

// GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.category_id = b.category_id
             AND t.user_id = b.user_id
             AND t.type = 'expense'
             AND t.date BETWEEN b.start_date AND b.end_date),
          0
        ) AS spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const { category_id, amount, period, start_date, end_date } = req.body;

    if (!category_id || !amount || !start_date || !end_date) {
      return res.status(400).json({ message: 'category_id, amount, start_date and end_date are required' });
    }

    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, category_id, amount, period || 'monthly', start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, period, start_date, end_date } = req.body;

    const result = await pool.query(
      `UPDATE budgets
       SET amount     = COALESCE($1, amount),
           period     = COALESCE($2, period),
           start_date = COALESCE($3, start_date),
           end_date   = COALESCE($4, end_date),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [amount, period, start_date, end_date, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
