const express = require('express');
const Joi = require('joi');
const { asyncHandler } = require('../middleware/errorHandler');
const { notificationService } = require('../services/notificationService');

const router = express.Router();

// Validation schemas
const testNotificationSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional()
});

// Test notification system
router.post('/test', asyncHandler(async (req, res) => {
  const { error, value } = testNotificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const { email, phone } = value;

  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'At least one contact method (email or phone) is required'
      }
    });
  }

  const results = await notificationService.testNotification(email, phone);

  res.json({
    success: true,
    data: {
      results,
      message: 'Test notification sent'
    }
  });
}));

// Get notification service status
router.get('/status', (req, res) => {
  const status = notificationService.getStatus();

  res.json({
    success: true,
    data: {
      status
    }
  });
});

// Send custom email
router.post('/email', asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email, subject, and message are required'
      }
    });
  }

  const success = await notificationService.sendEmail(to, subject, message);

  res.json({
    success: true,
    data: {
      sent: success,
      message: success ? 'Email sent successfully' : 'Failed to send email'
    }
  });
}));

// Send custom SMS
router.post('/sms', asyncHandler(async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Phone number and message are required'
      }
    });
  }

  const success = await notificationService.sendSMS(to, message);

  res.json({
    success: true,
    data: {
      sent: success,
      message: success ? 'SMS sent successfully' : 'Failed to send SMS'
    }
  });
}));

// Get notification templates
router.get('/templates', (req, res) => {
  const templates = {
    orderConfirmation: {
      name: 'Order Confirmation',
      description: 'Sent when a new order is created',
      requiredFields: ['orderId', 'totalAmount', 'expiresAt']
    },
    orderConfirmed: {
      name: 'Order Confirmed',
      description: 'Sent when an order is confirmed',
      requiredFields: ['orderId', 'totalAmount']
    },
    orderCancelled: {
      name: 'Order Cancelled',
      description: 'Sent when an order is cancelled',
      requiredFields: ['orderId', 'reason']
    },
    orderCompleted: {
      name: 'Order Ready for Pickup',
      description: 'Sent when an order is ready for pickup',
      requiredFields: ['orderId', 'totalAmount']
    },
    orderExpired: {
      name: 'Order Expired',
      description: 'Sent when an order expires',
      requiredFields: ['orderId']
    },
    paymentNotification: {
      name: 'Payment Status Update',
      description: 'Sent when payment status changes',
      requiredFields: ['orderId', 'paymentStatus', 'totalAmount']
    }
  };

  res.json({
    success: true,
    data: {
      templates
    }
  });
});

// Send specific notification type
router.post('/send/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { order, reason, paymentStatus } = req.body;

  if (!order) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Order data is required'
      }
    });
  }

  let success = false;

  switch (type) {
    case 'orderConfirmation':
      await notificationService.sendOrderConfirmation(order);
      success = true;
      break;
    case 'orderConfirmed':
      await notificationService.sendOrderConfirmed(order);
      success = true;
      break;
    case 'orderCancelled':
      if (!reason) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Reason is required for order cancellation notification'
          }
        });
      }
      await notificationService.sendOrderCancelled(order, reason);
      success = true;
      break;
    case 'orderCompleted':
      await notificationService.sendOrderCompleted(order);
      success = true;
      break;
    case 'orderExpired':
      await notificationService.sendOrderExpired(order);
      success = true;
      break;
    case 'paymentNotification':
      if (!paymentStatus) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Payment status is required for payment notification'
          }
        });
      }
      await notificationService.sendPaymentNotification(order, paymentStatus);
      success = true;
      break;
    default:
      return res.status(400).json({
        success: false,
        error: {
          message: `Unknown notification type: ${type}`
        }
      });
  }

  res.json({
    success: true,
    data: {
      sent: success,
      type,
      message: `${type} notification sent successfully`
    }
  });
}));

// Initialize notification service
router.post('/initialize', asyncHandler(async (req, res) => {
  await notificationService.initialize();

  res.json({
    success: true,
    data: {
      message: 'Notification service initialized successfully',
      status: notificationService.getStatus()
    }
  });
}));

module.exports = router;
