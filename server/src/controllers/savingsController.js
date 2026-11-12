const pool = require('../db/pool');

// GET /api/savings
const getSavingsGoals = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/savings
const createSavingsGoal = async (req, res, next) => {
  try {
    const { name, target_amount, target_date, color, icon } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ message: 'Name and target_amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, target_date, color, icon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name, target_amount, target_date || null, color || '#10b981', icon || 'piggy-bank']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/savings/:id
const updateSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, target_amount, target_date, color, icon, status } = req.body;

    const result = await pool.query(
      `UPDATE savings_goals
       SET name          = COALESCE($1, name),
           target_amount = COALESCE($2, target_amount),
           target_date   = COALESCE($3, target_date),
           color         = COALESCE($4, color),
           icon          = COALESCE($5, icon),
           status        = COALESCE($6, status),
           updated_at    = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, target_amount, target_date, color, icon, status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/savings/:id
const deleteSavingsGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }
    res.json({ message: 'Savings goal deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/savings/:id/contribute
const addContribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, note, date } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'A positive amount is required' });
    }

    const goal = await pool.query(
      'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (goal.rows.length === 0) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    await pool.query(
      `INSERT INTO savings_contributions (goal_id, user_id, amount, note, date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))`,
      [id, req.user.id, amount, note || null, date || null]
    );

    const updated = await pool.query(
      `UPDATE savings_goals
       SET current_amount = current_amount + $1,
           status = CASE WHEN current_amount + $1 >= target_amount THEN 'completed' ELSE status END,
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [amount, id, req.user.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/savings/:id/contributions
const getContributions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM savings_contributions
       WHERE goal_id = $1 AND user_id = $2
       ORDER BY date DESC`,
      [id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addContribution,
  getContributions,
};
