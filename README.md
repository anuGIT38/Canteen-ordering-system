# Canteen Ordering System - Team Member 3
## Order Management & Auto-Cancellation System

This module handles order lifecycle management, automated cancellation, and notification systems for the canteen ordering platform.

### Features Implemented

#### Core Order Management
- Order status management (Pending, Confirmed, Cancelled, Completed)
- Order creation and tracking
- Order history and analytics
- Payment integration hooks

#### Auto-Cancellation System
- Background scheduler for automatic order cancellation after 15 minutes
- Stock restoration on cancellation
- Configurable timeout periods

#### Notification System
- Email notifications for order status changes
- SMS notifications via Twilio
- Real-time order status updates

#### Queue Management
- Bull queue for background job processing
- Redis-based job scheduling
- Retry mechanisms for failed operations

### Prerequisites

- Node.js >= 16.0.0
- Redis server
- PostgreSQL/MySQL (to be integrated with Team Member 1)
- SMTP email service (Gmail, SendGrid, etc.)
- Twilio account (for SMS notifications)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp env.example .env
   ```

4. Configure your environment variables in `.env`

5. Start Redis server

6. Run the application:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### API Endpoints

#### Order Management
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - Get all orders (with filters)
- `GET /api/v1/orders/:id` - Get specific order
- `PUT /api/v1/orders/:id/status` - Update order status
- `DELETE /api/v1/orders/:id` - Cancel order

#### Order History
- `GET /api/v1/orders/history` - Get order history
- `GET /api/v1/orders/analytics` - Get order analytics

#### Notifications
- `POST /api/v1/notifications/test` - Test notification system

### Integration Points

#### With Team Member 1 (Backend Core & Database)
- Database schema integration
- User authentication middleware
- Menu item validation

#### With Team Member 2 (Inventory Management)
- Stock locking coordination
- Stock restoration on cancellation
- Real-time stock updates

#### With Team Member 4 & 5 (Frontend)
- Order status WebSocket events
- Real-time order updates
- Payment integration hooks

### Database Schema (Expected from Team Member 1)

```sql
-- Orders table (to be created by Team Member 1)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  pickup_time TIMESTAMP,
  notes TEXT
);

-- Order items table (to be created by Team Member 1)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);
```

### Configuration

Key configuration options in `.env`:

- `ORDER_TIMEOUT_MINUTES`: Time before auto-cancellation (default: 15)
- `AUTO_CANCELLATION_CHECK_INTERVAL`: Cron job interval in minutes (default: 1)
- `SMTP_*`: Email configuration
- `TWILIO_*`: SMS configuration

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Background Jobs

The system runs several background jobs:

1. **Auto-cancellation job**: Runs every minute to check for expired orders
2. **Notification job**: Processes pending notifications
3. **Cleanup job**: Removes old completed orders

### Monitoring

- Winston logging for all operations
- Queue monitoring via Bull dashboard
- Health check endpoint: `GET /api/v1/health`

### Error Handling

- Comprehensive error handling with proper HTTP status codes
- Retry mechanisms for failed operations
- Graceful degradation for external services

### Security

- Input validation using Joi
- Rate limiting on API endpoints
- Helmet for security headers
- CORS configuration

### Deployment

The application is designed to be deployed as a microservice and can be easily containerized with Docker.

### Team Integration Notes

This module is designed to work independently but integrates seamlessly with other team members' work through well-defined API contracts and event systems.
