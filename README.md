# Canteen Ordering System

A real-time canteen ordering system with inventory management, stock locking, and auto-cancellation features.

## 🏗️ Project Structure

```
Canteen-ordering-system/
├── database/                 # Team Member 1: Database & Core Services
│   ├── schema.sql           # Database schema with all tables
│   ├── connection.js        # PostgreSQL connection pool
│   ├── setup.js            # Database setup script
│   └── models/             # Data models for easy integration
│       ├── userModel.js    # User CRUD operations
│       ├── menuModel.js    # Menu & category management
│       ├── orderModel.js   # Order lifecycle management
│       └── stockModel.js   # Inventory & stock locking
├── backend/                 # Team Members 2 & 3: Backend Services
│   └── package.json        # Backend dependencies
├── frontend/                # Team Members 4 & 5: Frontend
│   └── package.json        # Frontend dependencies
├── config.env              # Environment configuration
└── README.md               # This file
```

## 👥 Team Member Responsibilities

### **Team Member 1: Database & Core Services** (YOU)
**Focus:** Database architecture, data models, and core business logic

**What you've built:**
- ✅ **PostgreSQL Database Schema** - Complete table structure with constraints
- ✅ **Database Connection Layer** - Connection pooling and management
- ✅ **Data Models** - Clean, reusable data access layer
- ✅ **Stock Management** - Inventory locking/unlocking system
- ✅ **Order Management** - Complete order lifecycle
- ✅ **User Management** - Authentication and user data

**Key Features:**
- **Inventory Locking**: Prevents overselling with transaction-safe stock management
- **Auto-cancellation**: Orders expire after 15 minutes automatically
- **Audit Trail**: Complete stock transaction history
- **ACID Compliance**: Database-level data integrity

### **Team Member 2: Inventory & Stock Locking**
- Integrates with your `StockModel` for real-time inventory updates
- Uses your database connection and models

### **Team Member 3: Order Management & Auto-cancellation**
- Integrates with your `OrderModel` for order processing
- Uses your `StockModel` for inventory operations

### **Team Member 4: Frontend Core & Menu**
- Calls your data models through the backend API
- Displays real-time stock information

### **Team Member 5: Frontend Order System**
- Integrates with order management through your models
- Real-time updates via WebSocket

## 🚀 Quick Start (Team Member 1)

### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Setup Database
```bash
# Navigate to database folder
cd database

# Install dependencies
npm install pg dotenv

# Run setup script
node setup.js
```

### 3. Test Database Connection
```bash
# Test connection
node -e "
const db = require('./connection.js');
db.query('SELECT NOW()').then(result => {
  console.log('✅ Database connected:', result.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});
"
```

## 🔌 Integration Points for Other Team Members

### **For Backend Team (Members 2 & 3):**

```javascript
// Import your models
const UserModel = require('../database/models/userModel');
const MenuModel = require('../database/models/menuModel');
const OrderModel = require('../database/models/orderModel');
const StockModel = require('../database/models/stockModel');

// Use in your services
const user = await UserModel.findById(userId);
const menuItems = await MenuModel.findAll();
const order = await OrderModel.create(orderData);
const lockedStock = await StockModel.lockStock(orderId, items);
```

### **For Frontend Team (Members 4 & 5):**

Your models will be exposed through REST API endpoints that other team members create. They'll call:

```javascript
// Example API calls they'll make
GET /api/menu          // Uses MenuModel.findAll()
POST /api/orders       // Uses OrderModel.create()
GET /api/orders/:id    // Uses OrderModel.findById()
PUT /api/orders/:id    // Uses OrderModel.updateStatus()
```

## 📊 Database Schema Overview

### **Core Tables:**
- **`users`** - User accounts and authentication
- **`menu_categories`** - Food categories (Beverages, Main Course, etc.)
- **`menu_items`** - Individual food items with stock tracking
- **`orders`** - Order headers with status and timing
- **`order_items`** - Individual items in each order
- **`stock_transactions`** - Complete audit trail of stock changes

### **Key Features:**
- **UUID Primary Keys** - Secure, scalable identifiers
- **Automatic Timestamps** - Created/updated tracking
- **Foreign Key Constraints** - Data integrity
- **Check Constraints** - Business rule validation
- **Indexes** - Performance optimization

## 🧪 Testing Your Database Layer

```bash
# Test user operations
node -e "
const UserModel = require('./database/models/userModel');

async function test() {
  try {
    // Test user creation
    const user = await UserModel.create({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ User created:', user);
    
    // Test user retrieval
    const foundUser = await UserModel.findByEmail('test@example.com');
    console.log('✅ User found:', foundUser);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
"
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with 12 salt rounds
- **SQL Injection Prevention** - Parameterized queries
- **Transaction Safety** - ACID compliance for critical operations
- **Audit Logging** - Complete stock transaction history

## 📈 Performance Features

- **Connection Pooling** - Efficient database connections
- **Strategic Indexing** - Fast queries on common operations
- **Batch Operations** - Efficient bulk data processing
- **Transaction Management** - Optimized database operations

## 🚨 Important Notes

1. **Environment Variables**: Update `config.env` with your database credentials
2. **Database Permissions**: Ensure PostgreSQL user has CREATE, INSERT, UPDATE, DELETE permissions
3. **Port Conflicts**: Default PostgreSQL port is 5432, change if needed
4. **Backup**: Your schema includes sample data - backup before production

## 🔄 Next Steps

1. **Test Database Setup** - Run setup script and verify tables
2. **Test Data Models** - Verify CRUD operations work correctly
3. **Share Connection Details** - Provide database credentials to other team members
4. **Document API Contracts** - Define expected data structures for integration

---

**Team Member 1 Status**: ✅ **COMPLETE** - Database layer ready for integration!

Your database foundation is solid and ready for other team members to build upon. The models provide clean, consistent interfaces that will make integration smooth and reliable.
