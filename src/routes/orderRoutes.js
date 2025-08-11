const express = require('express');
const Joi = require('joi');
const { asyncHandler } = require('../middleware/errorHandler');
const orderService = require('../services/orderService');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../models/Order');

const router = express.Router();

// Validation schemas
const createOrderSchema = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      menuItemId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().positive().required()
    })
  ).min(1).required(),
  notes: Joi.string().optional(),
  userEmail: Joi.string().email().optional(),
  userPhone: Joi.string().optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ORDER_STATUS)).required(),
  reason: Joi.string().optional(),
  updatedBy: Joi.string().optional()
});

const updatePaymentSchema = Joi.object({
  paymentStatus: Joi.string().valid(...Object.values(PAYMENT_STATUS)).required(),
  transactionId: Joi.string().optional(),
  paymentMethod: Joi.string().optional()
});

const orderFiltersSchema = Joi.object({
  userId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(ORDER_STATUS)).optional(),
  paymentStatus: Joi.string().valid(...Object.values(PAYMENT_STATUS)).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

// Create new order
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = createOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  // Calculate total amount
  const totalAmount = value.items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);

  const orderData = {
    ...value,
    totalAmount
  };

  const order = await orderService.createOrder(orderData);

  res.status(201).json({
    success: true,
    data: {
      order: order.getSummary(),
      message: 'Order created successfully'
    }
  });
}));

// Get all orders with filters
router.get('/', asyncHandler(async (req, res) => {
  const { error, value } = orderFiltersSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const result = await orderService.getOrders(value);

  res.json({
    success: true,
    data: {
      orders: result.orders.map(order => order.getSummary()),
      pagination: result.pagination
    }
  });
}));

// Get order by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await orderService.getOrderById(id);

  res.json({
    success: true,
    data: {
      order: {
        ...order,
        timeRemaining: order.getTimeRemaining(),
        isExpired: order.isExpired()
      }
    }
  });
}));

// Update order status
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const order = await orderService.updateOrderStatus(
    id, 
    value.status, 
    value.reason, 
    value.updatedBy
  );

  res.json({
    success: true,
    data: {
      order: order.getSummary(),
      message: `Order status updated to ${value.status}`
    }
  });
}));

// Update payment status
router.put('/:id/payment', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { error, value } = updatePaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const order = await orderService.updatePaymentStatus(
    id, 
    value.paymentStatus, 
    value.transactionId
  );

  res.json({
    success: true,
    data: {
      order: order.getSummary(),
      message: `Payment status updated to ${value.paymentStatus}`
    }
  });
}));

// Cancel order
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, cancelledBy } = req.body;

  const order = await orderService.cancelOrder(id, reason, cancelledBy);

  res.json({
    success: true,
    data: {
      order: order.getSummary(),
      message: 'Order cancelled successfully'
    }
  });
}));

// Complete order
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { completedBy } = req.body;

  const order = await orderService.completeOrder(id, completedBy);

  res.json({
    success: true,
    data: {
      order: order.getSummary(),
      message: 'Order completed successfully'
    }
  });
}));

// Get order history for a user
router.get('/history/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { error, value } = orderFiltersSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const result = await orderService.getOrderHistory(userId, value);

  res.json({
    success: true,
    data: {
      orders: result.orders.map(order => order.getSummary()),
      pagination: result.pagination
    }
  });
}));

// Get order analytics
router.get('/analytics/summary', asyncHandler(async (req, res) => {
  const { error, value } = orderFiltersSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const analytics = await orderService.getOrderAnalytics(value);

  res.json({
    success: true,
    data: {
      analytics
    }
  });
}));

// Get expired orders (admin only)
router.get('/expired/list', asyncHandler(async (req, res) => {
  const expiredOrders = await orderService.getExpiredOrders();

  res.json({
    success: true,
    data: {
      orders: expiredOrders.map(order => order.getSummary()),
      count: expiredOrders.length
    }
  });
}));

// Manually trigger auto-cancellation (admin only)
router.post('/auto-cancel/trigger', asyncHandler(async (req, res) => {
  const { schedulerService } = require('../services/schedulerService');
  
  const result = await schedulerService.triggerAutoCancellation();

  res.json({
    success: true,
    data: {
      ...result,
      message: 'Auto-cancellation triggered successfully'
    }
  });
}));

// Get order status options
router.get('/status/options', (req, res) => {
  res.json({
    success: true,
    data: {
      orderStatuses: Object.values(ORDER_STATUS),
      paymentStatuses: Object.values(PAYMENT_STATUS)
    }
  });
});

// Get order by ID with full details (admin only)
router.get('/:id/details', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await orderService.getOrderById(id);

  res.json({
    success: true,
    data: {
      order: {
        ...order,
        timeRemaining: order.getTimeRemaining(),
        isExpired: order.isExpired(),
        canBeCancelled: order.canBeCancelled(),
        isActive: order.isActive()
      }
    }
  });
}));

// Get orders by status
router.get('/status/:status', asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { error, value } = orderFiltersSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const filters = { ...value, status };
  const result = await orderService.getOrders(filters);

  res.json({
    success: true,
    data: {
      orders: result.orders.map(order => order.getSummary()),
      pagination: result.pagination
    }
  });
}));

// Get orders by payment status
router.get('/payment/:paymentStatus', asyncHandler(async (req, res) => {
  const { paymentStatus } = req.params;
  const { error, value } = orderFiltersSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      }
    });
  }

  const filters = { ...value, paymentStatus };
  const result = await orderService.getOrders(filters);

  res.json({
    success: true,
    data: {
      orders: result.orders.map(order => order.getSummary()),
      pagination: result.pagination
    }
  });
}));

module.exports = router;
