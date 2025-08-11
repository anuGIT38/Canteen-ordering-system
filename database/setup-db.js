const { Client } = require('pg');
require('dotenv').config({ path: '../config.env' });

async function setupDatabase() {
  console.log('🚀 Setting up Canteen Ordering System Database...\n');

  // First, try to connect to default postgres database
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL as postgres user');

    // Check if kirti user exists
    const userExists = await client.query(
      "SELECT 1 FROM pg_user WHERE usename = 'kirti'"
    );

    if (userExists.rows.length === 0) {
      console.log('👤 Creating kirti user...');
      await client.query("CREATE USER kirti WITH PASSWORD 'postgres'");
      console.log('✅ User kirti created');
    } else {
      console.log('✅ User kirti already exists');
    }

    // Grant necessary permissions
    await client.query("ALTER USER kirti CREATEDB");
    console.log('✅ Granted database creation permission to kirti');

    await client.end();

    // Now connect as kirti user to create the database
    const kirtiClient = new Client({
      user: 'kirti',
      host: 'localhost',
      database: 'postgres',
      password: 'postgres',
      port: 5432,
    });

    await kirtiClient.connect();
    console.log('✅ Connected as kirti user');

    // Check if database exists
    const dbExists = await kirtiClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'canteen_ordering_system'"
    );

    if (dbExists.rows.length === 0) {
      console.log('📝 Creating database: canteen_ordering_system');
      await kirtiClient.query('CREATE DATABASE canteen_ordering_system');
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }

    await kirtiClient.end();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📝 You can now run: npm run setup');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Alternative setup method:');
    console.log('1. Open Terminal and run: psql -U postgres');
    console.log('2. Enter password when prompted');
    console.log('3. Run: CREATE USER kirti WITH PASSWORD \'postgres\';');
    console.log('4. Run: ALTER USER kirti CREATEDB;');
    console.log('5. Run: CREATE DATABASE canteen_ordering_system OWNER kirti;');
    console.log('6. Exit psql and run: npm run setup');
  }
}

setupDatabase();
