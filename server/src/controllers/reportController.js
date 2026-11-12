const pool = require('../db/pool');

// GET /api/reports/summary?start_date=&end_date=
const getSummary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const params = [req.user.id];
    let dateFilter = '';
    if (start_date) { dateFilter += ` AND date >= $${params.length + 1}`; params.push(start_date); }
    if (end_date)   { dateFilter += ` AND date <= $${params.length + 1}`; params.push(end_date); }

    const totals = await pool.query(
      `SELECT
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
         COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = $1 ${dateFilter}`,
      params
    );

    const row = totals.rows[0];
    const income   = parseFloat(row.total_income   || 0);
    const expenses = parseFloat(row.total_expenses || 0);

    res.json({
      total_income: income,
      total_expenses: expenses,
      net_savings: income - expenses,
      transaction_count: parseInt(row.transaction_count),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/by-category?type=expense&start_date=&end_date=
const getByCategory = async (req, res, next) => {
  try {
    const { type = 'expense', start_date, end_date } = req.query;

    const params = [req.user.id, type];
    let dateFilter = '';
    if (start_date) { dateFilter += ` AND t.date >= $${params.length + 1}`; params.push(start_date); }
    if (end_date)   { dateFilter += ` AND t.date <= $${params.length + 1}`; params.push(end_date); }

    const result = await pool.query(
      `SELECT
         c.id, c.name, c.color, c.icon,
         SUM(t.amount) AS total,
         COUNT(t.id) AS count
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.type = $2 ${dateFilter}
       GROUP BY c.id, c.name, c.color, c.icon
       ORDER BY total DESC`,
      params
    );

    res.json(
      result.rows.map((row) => ({
        ...row,
        name: row.name || 'Uncategorized',
        color: row.color || '#6366f1',
        total: parseFloat(row.total || 0),
        count: parseInt(row.count || 0, 10),
      }))
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/monthly?year=2026 OR ?start_date=&end_date=&all=true
const getMonthly = async (req, res, next) => {
  try {
    const { year, start_date, end_date, all } = req.query;

    if (all === 'true' || start_date || end_date) {
      const params = [req.user.id];
      let dateFilter = '';
      if (start_date) { dateFilter += ` AND date >= $${params.length + 1}`; params.push(start_date); }
      if (end_date)   { dateFilter += ` AND date <= $${params.length + 1}`; params.push(end_date); }

      const result = await pool.query(
        `SELECT
           TO_CHAR(date, 'YYYY-MM') AS period,
           SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
         FROM transactions
         WHERE user_id = $1 ${dateFilter}
         GROUP BY period
         ORDER BY period`,
        params
      );

      return res.json(
        result.rows.map((row) => ({
          period: row.period,
          income: parseFloat(row.income || 0),
          expenses: parseFloat(row.expenses || 0),
        }))
      );
    }

    const targetYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM date)::int AS month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY month
       ORDER BY month`,
      [req.user.id, targetYear]
    );

    // Fill all 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expenses: 0,
    }));

    result.rows.forEach((row) => {
      const idx = row.month - 1;
      months[idx].income   = parseFloat(row.income);
      months[idx].expenses = parseFloat(row.expenses);
    });

    res.json(months);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/daily?start_date=&end_date=
const getDaily = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const params = [req.user.id];
    let dateFilter = '';
    if (start_date) { dateFilter += ` AND date >= $${params.length + 1}`; params.push(start_date); }
    if (end_date)   { dateFilter += ` AND date <= $${params.length + 1}`; params.push(end_date); }

    const result = await pool.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM-DD') AS date,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE user_id = $1 ${dateFilter}
       GROUP BY date
       ORDER BY date`,
      params
    );

    res.json(
      result.rows.map((row) => ({
        date: row.date,
        income: parseFloat(row.income || 0),
        expenses: parseFloat(row.expenses || 0),
      }))
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getByCategory, getMonthly, getDaily };
