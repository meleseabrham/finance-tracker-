const pool = require('../db/pool');

// GET /api/currencies
const getCurrencies = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM currencies WHERE user_id = $1 ORDER BY code ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/currencies
const createCurrency = async (req, res, next) => {
  try {
    const { code, name, symbol, color } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    const trimmedName = name?.trim();

    if (!normalizedCode || !trimmedName) {
      return res.status(400).json({ message: 'Code and name are required' });
    }

    const existing = await pool.query(
      'SELECT id FROM currencies WHERE user_id = $1 AND code = $2',
      [req.user.id, normalizedCode]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: `Currency "${normalizedCode}" already exists` });
    }

    const result = await pool.query(
      `INSERT INTO currencies (user_id, code, name, symbol, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, normalizedCode, trimmedName, symbol?.trim() || '', color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/currencies/:id
const updateCurrency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, color } = req.body;
    const normalizedCode = code ? code.trim().toUpperCase() : null;
    const trimmedName = name ? name.trim() : null;

    if (normalizedCode) {
      const duplicate = await pool.query(
        'SELECT id FROM currencies WHERE user_id = $1 AND code = $2 AND id <> $3',
        [req.user.id, normalizedCode, id]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ message: `Currency "${normalizedCode}" already exists` });
      }
    }

    const result = await pool.query(
      `UPDATE currencies
       SET code       = COALESCE($1, code),
           name       = COALESCE($2, name),
           symbol     = COALESCE($3, symbol),
           color      = COALESCE($4, color),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [normalizedCode, trimmedName, symbol !== undefined ? symbol.trim() : null, color, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/currencies/:id
const deleteCurrency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM currencies WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Currency not found' });
    }
    res.json({ message: 'Currency deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCurrencies, createCurrency, updateCurrency, deleteCurrency };

