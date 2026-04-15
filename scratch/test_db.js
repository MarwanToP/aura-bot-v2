import 'dotenv/config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function test() {
  console.log('Testing Neon Database connection...');
  try {
    await sequelize.authenticate();
    console.log('✅ Success! Database connected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed! Database connection error:', err.message);
    process.exit(1);
  }
}

test();
