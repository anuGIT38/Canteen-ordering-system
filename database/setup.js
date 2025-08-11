const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Canteen Ordering System Database...\n');

  // Connect to default postgres database to create our database
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default database first
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'canteen_ordering_system'"
    );

    if (dbExists.rows.length === 0) {
      console.log('📝 Creating database: canteen_ordering_system');
      await client.query('CREATE DATABASE canteen_ordering_system');
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }

    await client.end();

    // Now connect to our database and run schema
    const dbClient = new Client({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'canteen_ordering_system',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    await dbClient.connect();
    console.log('✅ Connected to canteen_ordering_system database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Running database schema...');
    await dbClient.query(schema);
    console.log('✅ Schema executed successfully');

    // Verify tables were created
    const tables = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify sample data
    const menuItems = await dbClient.query('SELECT COUNT(*) as count FROM menu_items');
    const categories = await dbClient.query('SELECT COUNT(*) as count FROM menu_categories');
    
    console.log(`\n📦 Sample data loaded:`);
    console.log(`   - Menu Categories: ${categories.rows[0].count}`);
    console.log(`   - Menu Items: ${menuItems.rows[0].count}`);

    await dbClient.end();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your backend server');
    console.log('2. Test the API endpoints');
    console.log('3. Start the frontend application');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '../config.env' });

// Run setup
setupDatabase();
