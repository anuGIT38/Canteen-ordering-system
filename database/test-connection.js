require('dotenv').config({ path: '../config.env' });
const db = require('./connection');

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    const result = await db.query('SELECT NOW() as current_time, version() as version');
    
    console.log('✅ Database connected successfully!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL version:', result.rows[0].version.split(' ')[1]);
    
    // Test if we can create a database
    console.log('\n🔍 Checking if canteen_ordering_system database exists...');
    
    const dbExists = await db.query(
      "SELECT 1 FROM pg_database WHERE datname = 'canteen_ordering_system'"
    );
    
    if (dbExists.rows.length > 0) {
      console.log('✅ Database canteen_ordering_system already exists');
    } else {
      console.log('ℹ️  Database canteen_ordering_system does not exist (will be created by setup)');
    }
    
    console.log('\n🎉 Connection test completed successfully!');
    console.log('📝 You can now run: npm run setup');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running: brew services start postgresql@14');
    console.log('2. Check your database credentials in config.env');
    console.log('3. Ensure you have permission to create databases');
  } finally {
    process.exit(0);
  }
}

testConnection();
