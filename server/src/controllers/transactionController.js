const pool = require('../db/pool');

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { type, category_id, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [req.user.id];
    let idx = 2;

    if (type) { query += ` AND t.type = $${idx++}`; params.push(type); }
    if (category_id) { query += ` AND t.category_id = $${idx++}`; params.push(category_id); }
    if (start_date) { query += ` AND t.date >= $${idx++}`; params.push(start_date); }
    if (end_date) { query += ` AND t.date <= $${idx++}`; params.push(end_date); }

    const countQuery = query.replace(
      'SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon',
      'SELECT COUNT(*)'
    );
    const countResult = await pool.query(countQuery, params);

    query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { category_id, amount, type, description, date } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: 'Amount and type are required' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, description, date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
       RETURNING *`,
      [req.user.id, category_id || null, amount, type, description || null, date || null]
    );

    const tx = result.rows[0];
    if (tx.category_id) {
      const cat = await pool.query('SELECT name, color, icon FROM categories WHERE id = $1', [tx.category_id]);
      if (cat.rows.length > 0) {
        tx.category_name = cat.rows[0].name;
        tx.category_color = cat.rows[0].color;
        tx.category_icon = cat.rows[0].icon;
      }
    }

    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, amount, type, description, date } = req.body;

    const existing = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = COALESCE($1, category_id),
           amount      = COALESCE($2, amount),
           type        = COALESCE($3, type),
           description = COALESCE($4, description),
           date        = COALESCE($5, date),
           updated_at  = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [category_id, amount, type, description, date, id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
