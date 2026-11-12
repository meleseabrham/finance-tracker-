const pool = require('./pool');
const { seedDefaultCurrencies } = require('./defaults');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(150) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        currency   VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name       VARCHAR(100) NOT NULL,
        type       VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
        color      VARCHAR(20) DEFAULT '#6366f1',
        icon       VARCHAR(50) DEFAULT 'tag',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        amount      NUMERIC(12,2) NOT NULL,
        type        VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
        description VARCHAR(255),
        date        DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Budgets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        amount      NUMERIC(12,2) NOT NULL,
        period      VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly','monthly','yearly')),
        start_date  DATE NOT NULL,
        end_date    DATE NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Savings goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name          VARCHAR(150) NOT NULL,
        target_amount NUMERIC(12,2) NOT NULL,
        current_amount NUMERIC(12,2) DEFAULT 0,
        target_date   DATE,
        color         VARCHAR(20) DEFAULT '#10b981',
        icon          VARCHAR(50) DEFAULT 'piggy-bank',
        status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Savings contributions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS savings_contributions (
        id       SERIAL PRIMARY KEY,
        goal_id  INTEGER REFERENCES savings_goals(id) ON DELETE CASCADE,
        user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount   NUMERIC(12,2) NOT NULL,
        note     VARCHAR(255),
        date     DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Currencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        code       VARCHAR(10) NOT NULL,
        name       VARCHAR(100) NOT NULL,
        symbol     VARCHAR(10) DEFAULT '',
        color      VARCHAR(20) DEFAULT '#6366f1',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, code)
      );
    `);

    // Backfill default currencies for existing users who have none yet
    const usersWithoutCurrencies = await client.query(`
      SELECT u.id
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM currencies c WHERE c.user_id = u.id
      )
    `);
    for (const user of usersWithoutCurrencies.rows) {
      await seedDefaultCurrencies(user.id, client);
    }

    await client.query('COMMIT');
    console.log('✅  Database tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
