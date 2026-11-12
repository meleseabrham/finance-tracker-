const bcrypt = require('bcryptjs');
const pool = require('./pool');
const { createTables } = require('./migrate');
const { seedDefaultCategories, seedDefaultCurrencies } = require('./defaults');

const seedAdminUser = async () => {
  try {
    await createTables();

    const admins = [
      {
        name: 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@fintrack.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        currency: 'USD',
      },
 
    ];

    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      const res = await pool.query(
        `INSERT INTO users (name, email, password, currency)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             name = EXCLUDED.name,
             updated_at = NOW()
         RETURNING id, name, email, currency`,
        [admin.name, admin.email, hashedPassword, admin.currency]
      );

      const user = res.rows[0];
      await seedDefaultCategories(user.id);
      await seedDefaultCurrencies(user.id);
      console.log(`✅ Admin account created/updated: ${user.email} (ID: ${user.id})`);
    }

    console.log('🎉 Admin accounts seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin account:', error);
    process.exit(1);
  }
};

seedAdminUser();

