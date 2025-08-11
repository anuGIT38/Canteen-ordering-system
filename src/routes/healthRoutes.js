const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Order Management Service is healthy',
    timestamp: new Date().toISOString(),
    service: 'order-management',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Detailed health check
router.get('/detailed', asyncHandler(async (req, res) => {
  const healthStatus = {
    success: true,
    service: 'order-management',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      memory: {
        status: 'healthy',
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      },
      process: {
        status: 'healthy',
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  };

  res.status(200).json(healthStatus);
}));

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Order Management API Documentation',
    version: '1.0.0',
    endpoints: {
      orders: {
        base: '/api/v1/orders',
        endpoints: {
          'POST /': 'Create a new order',
          'GET /': 'Get all orders with filters',
          'GET /:id': 'Get order by ID',
          'PUT /:id/status': 'Update order status',
          'PUT /:id/payment': 'Update payment status',
          'DELETE /:id': 'Cancel order',
          'POST /:id/complete': 'Complete order',
          'GET /history/:userId': 'Get order history for user',
          'GET /analytics/summary': 'Get order analytics',
          'POST /auto-cancel/trigger': 'Manually trigger auto-cancellation'
        }
      },
      notifications: {
        base: '/api/v1/notifications',
        endpoints: {
          'POST /test': 'Send test notification',
          'GET /status': 'Get notification service status',
          'POST /email': 'Send custom email',
          'POST /sms': 'Send custom SMS',
          'GET /templates': 'Get notification templates',
          'POST /send/:type': 'Send specific notification type'
        }
      },
      health: {
        base: '/api/v1/health',
        endpoints: {
          'GET /': 'Basic health check',
          'GET /detailed': 'Detailed health check',
          'GET /docs': 'API documentation'
        }
      }
    },
    orderStatuses: ['pending', 'confirmed', 'cancelled', 'completed', 'expired'],
    paymentStatuses: ['pending', 'paid', 'failed', 'refunded'],
    integrationPoints: {
      'Team Member 1': 'Database schema and authentication',
      'Team Member 2': 'Stock locking and restoration',
      'Team Member 4': 'Frontend menu system',
      'Team Member 5': 'Frontend order flow and real-time updates'
    }
  });
});

// Service status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'order-management',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      orderManagement: 'active',
      autoCancellation: 'active',
      notifications: 'active',
      backgroundJobs: 'active',
      paymentHooks: 'active'
    }
  });
});

module.exports = router;
