# Canteen Ordering System - Inventory Management Module

## Team Member 2: Inventory Management & Stock Locking

This module provides the core inventory management and stock locking functionality for the canteen ordering system. It ensures real-time stock tracking, prevents overselling, and provides seamless integration with other team members' modules.

## Features

### Core Inventory Management

- **Real-time Stock Tracking**: Live stock counts with locked stock consideration
- **Stock Locking System**: Prevents overselling during order placement
- **Transaction-Safe Updates**: Database transactions ensure data consistency
- **Stock Validation**: Middleware for validating stock availability

### Stock Locking Mechanism

- **Order Placement**: Locks stock for 15 minutes when order is placed
- **Order Cancellation**: Releases locked stock back to available inventory
- **Order Confirmation**: Reduces actual stock and removes locks
- **Auto-Expiration**: Automatic cleanup of expired stock locks

### Real-time Features

- **WebSocket Integration**: Real-time stock updates to all connected clients
- **Live Notifications**: Stock alerts and system notifications
- **Admin Dashboard**: Real-time monitoring of stock locks and inventory

### Background Services

- **Scheduled Cleanup**: Automatic cleanup of expired stock locks (every 5 minutes)
- **Health Monitoring**: Stock health checks and low stock alerts (every 10 minutes)
- **WebSocket Health**: Connection monitoring (every 30 seconds)

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (database layer handled by Team Member 1)
- **Caching**: Redis for stock lock caching
- **Real-time**: Socket.io for WebSocket communication
- **Scheduling**: node-cron for background tasks
- **Logging**: Winston for structured logging

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Canteen-ordering-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/canteen_db"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3001
   NODE_ENV=development
   ```

4. **Set up Redis** (required for stock locking)

   ```bash
   # Windows: Download from https://github.com/microsoftarchive/redis/releases or use WSL
   # macOS: brew install redis && brew services start redis
   # Linux: sudo apt-get install redis-server && sudo systemctl start redis
   ```

5. **Set up the database**

   ```bash
   # Database setup is handled by Team Member 1
   # This module uses a placeholder database interface
   # that will be replaced with actual database implementation
   ```

6. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Stock Management

- `GET /api/inventory/stock` - Get real-time stock information
- `GET /api/inventory/stock/:menuItemId` - Get stock for specific item
- `PUT /api/inventory/stock/:menuItemId` - Update stock count (admin)

### Stock Locking

- `POST /api/inventory/lock` - Lock stock for order
- `POST /api/inventory/release` - Release stock lock
- `POST /api/inventory/confirm` - Confirm stock lock

### Admin Functions

- `GET /api/inventory/locks` - Get active stock locks
- `POST /api/inventory/cleanup` - Clean up expired locks

### System Status

- `GET /health` - Server health check
- `GET /api/websocket/status` - WebSocket status
- `POST /api/scheduler/cleanup` - Manual cleanup trigger
- `POST /api/scheduler/health-check` - Manual health check

## WebSocket Events

### Client Events

- `join-room` - Join specific room (e.g., 'admin')
- `leave-room` - Leave specific room
- `request-stock-update` - Request stock update for item
- `request-order-update` - Request order update

### Server Events

- `stock-update` - Real-time stock updates
- `order-update` - Order status updates
- `stock-lock` - Stock lock notifications
- `stock-release` - Stock release notifications
- `system-notification` - System-wide notifications
- `notification` - Client-specific notifications

## Database Schema

### Core Tables

- **users** - User accounts and roles
- **menu_items** - Menu items with stock information
- **orders** - Order records
- **order_items** - Individual items in orders
- **stock_locks** - Active stock locks for orders

### Key Relationships

- Orders belong to users
- Order items link orders to menu items
- Stock locks link orders to menu items with quantities

## Integration Points

### With Team Member 1 (Backend Core)

- **Database Integration**: Uses shared Prisma schema
- **User Authentication**: Integrates with user management system
- **Menu Management**: Provides stock data for menu operations

### With Team Member 3 (Order Management)

- **Order Creation**: Triggers stock locking
- **Order Cancellation**: Triggers stock release
- **Order Confirmation**: Triggers stock confirmation
- **Auto-Cancellation**: Integrates with order expiration system

### With Team Member 4 (Frontend Core)

- **Real-time Updates**: Provides live stock data via WebSocket
- **Cart Validation**: Validates stock before adding to cart
- **Menu Display**: Shows live stock counts on menu items

### With Team Member 5 (Frontend Order System)

- **Order Flow**: Real-time stock updates during checkout
- **Admin Dashboard**: Provides inventory management interface
- **Order Tracking**: Real-time order status updates

## Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Use Postman or curl to test endpoints
3. Connect WebSocket client to test real-time features
4. Monitor logs for system activity

### Automated Testing

```bash
npm test
```

### Test Scenarios

1. **Stock Locking**: Place order → verify stock locked → cancel order → verify stock released
2. **Stock Confirmation**: Place order → confirm order → verify stock reduced
3. **Real-time Updates**: Monitor WebSocket events during stock operations
4. **Auto Cleanup**: Wait for scheduled cleanup or trigger manually

## Monitoring and Logging

### Log Files

- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only

### Health Checks

- Server health: `GET /health`
- WebSocket status: `GET /api/websocket/status`

### Scheduled Tasks

- **Expired Lock Cleanup**: Every 5 minutes
- **Stock Health Check**: Every 10 minutes
- **WebSocket Health Check**: Every 30 seconds

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/canteen_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Stock Locking
STOCK_LOCK_TIMEOUT=900000
STOCK_LOCK_PREFIX="stock_lock:"

# WebSocket
WS_PORT=3002

# Logging
LOG_LEVEL=info
```

### Stock Locking Configuration

- **Lock Timeout**: 15 minutes (900000ms)
- **Cleanup Interval**: 5 minutes
- **Health Check Interval**: 10 minutes

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Run migrations: `npm run migrate`

2. **Redis Connection Error**

   - Verify Redis is running
   - Check REDIS_URL in .env

3. **WebSocket Connection Issues**

   - Check CORS configuration
   - Verify frontend URL in .env
   - Check WebSocket status endpoint

4. **Stock Lock Issues**
   - Check stock lock timeout configuration
   - Verify cleanup tasks are running
   - Monitor stock lock table

### Debug Mode

Set `LOG_LEVEL=debug` in .env for detailed logging.

## Development

### Project Structure

```
src/
├── config/
│   ├── database.js      # Prisma client configuration
│   └── redis.js         # Redis client configuration
├── middleware/
│   └── stockValidation.js # Stock validation middleware
├── routes/
│   └── inventoryRoutes.js # API routes
├── services/
│   ├── inventoryService.js # Core inventory logic
│   ├── websocketService.js # WebSocket management
│   └── schedulerService.js # Background tasks
└── utils/
    └── logger.js        # Winston logger configuration
```

### Adding New Features

1. Create service methods in appropriate service files
2. Add API routes in inventoryRoutes.js
3. Update WebSocket events if needed
4. Add tests for new functionality
5. Update documentation

## Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Configure production database and Redis
3. Set secure JWT secret
4. Configure proper logging
5. Set up monitoring and alerts

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include logging for debugging
4. Update documentation
5. Test thoroughly before submitting

## License

This project is part of the Canteen Ordering System and follows the team's coding standards and practices.
