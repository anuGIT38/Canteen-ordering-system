const { Client } = require('pg');
require('dotenv').config({ path: '../config.env' });

async function createDatabase() {
  console.log('🚀 Creating canteen_ordering_system database...\n');

  // Connect to default postgres database
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Connect to default database first
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL as postgres user');

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'canteen_ordering_system'"
    );

    if (dbExists.rows.length === 0) {
      console.log('📝 Creating database: canteen_ordering_system');
      await client.query('CREATE DATABASE canteen_ordering_system');
      console.log('✅ Database created successfully!');
    } else {
      console.log('✅ Database already exists');
    }

    await client.end();
    
    console.log('\n🎉 Database creation completed!');
    console.log('📝 You can now run: npm run setup');

  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    console.log('\n🔧 Manual steps:');
    console.log('1. Open Terminal');
    console.log('2. Run: psql -U postgres');
    console.log('3. Enter password: postgres');
    console.log('4. Run: CREATE DATABASE canteen_ordering_system;');
    console.log('5. Run: \\q to exit');
  }
}

createDatabase();
