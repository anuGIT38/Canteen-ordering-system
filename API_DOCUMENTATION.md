# Inventory Management System API Documentation

## Overview

This document describes the API endpoints for the Inventory Management & Stock Locking system (Team Member 2). The system provides real-time stock management, stock locking mechanisms, and WebSocket-based real-time updates.

## Database Integration Note

This module currently uses a placeholder database interface that will be replaced with the actual database implementation from Team Member 1. All database operations are logged but return placeholder data. The interface is designed to be easily replaceable with the actual database layer.

## Base URL

```
http://localhost:3001
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health Check

**GET** `/health`

- **Description**: Check if the server is running
- **Access**: Public
- **Response**:

```json
{
  "success": true,
  "message": "Inventory Management System is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### Stock Management

#### Get Real-time Stock Information

**GET** `/api/inventory/stock`

- **Description**: Get real-time stock information for all menu items
- **Access**: Public
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "menu-item-id",
      "name": "Chicken Burger",
      "stockCount": 50,
      "isAvailable": true,
      "category": "Burgers",
      "price": "12.99",
      "availableStock": 48,
      "lockedStock": 2
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Get Stock Information for Specific Item

**GET** `/api/inventory/stock/:menuItemId`

- **Description**: Get stock information for a specific menu item
- **Access**: Public
- **Parameters**:
  - `menuItemId` (string): The menu item ID
- **Response**:

```json
{
  "success": true,
  "data": {
    "menuItemId": "menu-item-id",
    "availableStock": 48,
    "lockedStock": 2,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Update Stock Count (Admin)

**PUT** `/api/inventory/stock/:menuItemId`

- **Description**: Update stock count for a menu item
- **Access**: Admin only
- **Parameters**:
  - `menuItemId` (string): The menu item ID
- **Body**:

```json
{
  "newStockCount": 60
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Stock count updated successfully",
  "data": {
    "id": "menu-item-id",
    "name": "Chicken Burger",
    "stockCount": 60,
    "isAvailable": true
  }
}
```

### Stock Locking

#### Lock Stock for Order

**POST** `/api/inventory/lock`

- **Description**: Lock stock for an order when it's placed
- **Access**: Private (requires order context)
- **Body**:

```json
{
  "orderId": "order-id",
  "items": [
    {
      "menuItemId": "menu-item-id",
      "quantity": 2
    }
  ]
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Stock locked successfully",
  "data": {
    "orderId": "order-id",
    "lockedItems": [
      {
        "menuItemId": "menu-item-id",
        "quantity": 2,
        "status": "locked"
      }
    ]
  }
}
```

#### Release Stock Lock

**POST** `/api/inventory/release`

- **Description**: Release stock lock when order is cancelled
- **Access**: Private (requires order context)
- **Body**:

```json
{
  "orderId": "order-id"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Stock lock released successfully",
  "data": {
    "orderId": "order-id"
  }
}
```

#### Confirm Stock Lock

**POST** `/api/inventory/confirm`

- **Description**: Confirm stock lock and reduce actual stock when order is confirmed
- **Access**: Private (requires order context)
- **Body**:

```json
{
  "orderId": "order-id"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Stock confirmed and reduced successfully",
  "data": {
    "orderId": "order-id"
  }
}
```

### Admin Functions

#### Get Active Stock Locks

**GET** `/api/inventory/locks`

- **Description**: Get all active stock locks (admin function)
- **Access**: Admin only
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "lock-id",
      "orderId": "order-id",
      "menuItemId": "menu-item-id",
      "quantity": 2,
      "lockedAt": "2024-01-01T12:00:00.000Z",
      "expiresAt": "2024-01-01T12:15:00.000Z",
      "isActive": true,
      "menuItem": {
        "id": "menu-item-id",
        "name": "Chicken Burger",
        "stockCount": 50
      },
      "order": {
        "id": "order-id",
        "status": "PENDING",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    }
  ],
  "count": 1
}
```

#### Clean Up Expired Locks

**POST** `/api/inventory/cleanup`

- **Description**: Clean up expired stock locks (admin function)
- **Access**: Admin only
- **Response**:

```json
{
  "success": true,
  "message": "Expired stock locks cleaned up successfully",
  "data": {
    "cleanedCount": 5,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### WebSocket Status

#### Get WebSocket Status

**GET** `/api/websocket/status`

- **Description**: Get WebSocket connection status and active tasks
- **Access**: Public
- **Response**:

```json
{
  "success": true,
  "data": {
    "connectedClients": 5,
    "activeTasks": [
      "expiredLockCleanup",
      "stockHealthCheck",
      "websocketHealthCheck"
    ]
  }
}
```

### Scheduler Control

#### Trigger Manual Cleanup

**POST** `/api/scheduler/cleanup`

- **Description**: Manually trigger expired lock cleanup
- **Access**: Admin only
- **Response**:

```json
{
  "success": true,
  "message": "Manual cleanup triggered successfully",
  "data": {
    "cleanedCount": 3
  }
}
```

#### Trigger Manual Health Check

**POST** `/api/scheduler/health-check`

- **Description**: Manually trigger stock health check
- **Access**: Admin only
- **Response**:

```json
{
  "success": true,
  "message": "Manual health check triggered successfully",
  "data": {
    "stockInfo": [...]
  }
}
```

## WebSocket Events

### Connection

Connect to WebSocket server:

```javascript
const socket = io("http://localhost:3001");
```

### Events

#### Join Room

```javascript
socket.emit("join-room", "admin"); // Join admin room for admin notifications
```

#### Leave Room

```javascript
socket.emit("leave-room", "admin");
```

#### Stock Update

```javascript
socket.on("stock-update", (data) => {
  console.log("Stock updated:", data);
  // data: { type: 'stock-update', data: [...], timestamp: '...' }
});
```

#### Order Update

```javascript
socket.on("order-update", (data) => {
  console.log("Order updated:", data);
  // data: { type: 'order-update', orderId: '...', data: {...}, timestamp: '...' }
});
```

#### Stock Lock

```javascript
socket.on("stock-lock", (data) => {
  console.log("Stock locked:", data);
  // data: { type: 'stock-lock', data: {...}, timestamp: '...' }
});
```

#### Stock Release

```javascript
socket.on("stock-release", (data) => {
  console.log("Stock released:", data);
  // data: { type: 'stock-release', data: {...}, timestamp: '...' }
});
```

#### System Notification

```javascript
socket.on("system-notification", (data) => {
  console.log("System notification:", data);
  // data: { type: 'system-notification', data: {...}, timestamp: '...' }
});
```

#### Notification

```javascript
socket.on("notification", (data) => {
  console.log("Notification:", data);
  // data: { type: 'notification', data: {...}, timestamp: '...' }
});
```

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation error message",
  "unavailableItems": [
    {
      "menuItemId": "menu-item-id",
      "requestedQuantity": 5,
      "availableStock": 3,
      "isAvailable": false
    }
  ]
}
```

### Insufficient Stock Error (400)

```json
{
  "success": false,
  "message": "Insufficient stock for Chicken Burger. Available: 3, Requested: 5",
  "failedItem": {
    "menuItemId": "menu-item-id",
    "quantity": 5
  }
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Integration Points

### With Team Member 1 (Backend Core)

- Database schema integration through Prisma
- User authentication integration
- Menu item CRUD operations

### With Team Member 3 (Order Management)

- Order creation triggers stock locking
- Order cancellation triggers stock release
- Order confirmation triggers stock confirmation
- Auto-cancellation triggers stock release

### With Team Member 4 (Frontend Core)

- Real-time stock updates via WebSocket
- Stock validation for cart operations
- Menu display with live stock counts

### With Team Member 5 (Frontend Order System)

- Real-time order status updates
- Stock updates during order flow
- Admin dashboard integration

## Environment Variables

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

## Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Run database migrations: `npm run migrate`
3. Seed the database: `npm run seed`
4. Test endpoints using Postman or curl

### Automated Testing

```bash
npm test
```

## Monitoring

### Logs

- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`

### Health Checks

- Server health: `GET /health`
- WebSocket status: `GET /api/websocket/status`

### Scheduled Tasks

- Expired lock cleanup: Every 5 minutes
- Stock health check: Every 10 minutes
- WebSocket health check: Every 30 seconds
