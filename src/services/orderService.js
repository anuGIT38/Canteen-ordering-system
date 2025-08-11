const { Order, ORDER_STATUS, PAYMENT_STATUS } = require('../models/Order');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('./notificationService');

// In-memory storage for development (replace with database integration)
let orders = new Map();
let orderCounter = 1;

class OrderService {
  // Create a new order
  async createOrder(orderData) {
    try {
      // Validate order data
      const validation = Order.validate(orderData);
      if (!validation.isValid) {
        throw new AppError(`Validation failed: ${validation.errors.join(', ')}`, 400);
      }

      // Create new order
      const order = new Order(orderData);
      
      // Store order
      orders.set(order.id, order);
      
      logger.info('Order created successfully', {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount
      });

      // Send order confirmation notification
      await notificationService.sendOrderConfirmation(order);

      return order;
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const order = orders.get(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }
      return order;
    } catch (error) {
      logger.error('Error getting order:', error);
      throw error;
    }
  }

  // Get all orders with filters
  async getOrders(filters = {}) {
    try {
      let filteredOrders = Array.from(orders.values());

      // Apply filters
      if (filters.userId) {
        filteredOrders = filteredOrders.filter(order => order.userId === filters.userId);
      }

      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }

      if (filters.paymentStatus) {
        filteredOrders = filteredOrders.filter(order => order.paymentStatus === filters.paymentStatus);
      }

      if (filters.startDate) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= new Date(filters.endDate)
        );
      }

      // Sort by creation date (newest first)
      filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      return {
        orders: paginatedOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredOrders.length / limit),
          totalOrders: filteredOrders.length,
          hasNextPage: endIndex < filteredOrders.length,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting orders:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, newStatus, reason = null, updatedBy = null) {
    try {
      const order = await this.getOrderById(orderId);
      
      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        throw new AppError(`Invalid status transition from ${order.status} to ${newStatus}`, 400);
      }

      // Update status
      const statusChange = order.updateStatus(newStatus, reason, updatedBy);
      
      // Store updated order
      orders.set(order.id, order);

      logger.info('Order status updated', {
        orderId: order.id,
        oldStatus: statusChange.oldStatus,
        newStatus: statusChange.newStatus,
        reason: reason,
        updatedBy: updatedBy
      });

      // Send notification based on status change
      await this.handleStatusChangeNotification(order, statusChange);

      // Handle stock restoration if cancelled
      if (newStatus === ORDER_STATUS.CANCELLED) {
        await this.handleStockRestoration(order);
      }

      return order;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId, reason = null, cancelledBy = null) {
    try {
      const order = await this.getOrderById(orderId);
      
      if (!order.canBeCancelled()) {
        throw new AppError('Order cannot be cancelled in its current status', 400);
      }

      return await this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, reason, cancelledBy);
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Complete order
  async completeOrder(orderId, completedBy = null) {
    try {
      const order = await this.getOrderById(orderId);
      
      if (order.status !== ORDER_STATUS.CONFIRMED) {
        throw new AppError('Order must be confirmed before completion', 400);
      }

      return await this.updateOrderStatus(orderId, ORDER_STATUS.COMPLETED, 'Order completed', completedBy);
    } catch (error) {
      logger.error('Error completing order:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    try {
      const order = await this.getOrderById(orderId);
      
      order.updatePaymentStatus(paymentStatus, transactionId);
      orders.set(order.id, order);

      logger.info('Payment status updated', {
        orderId: order.id,
        paymentStatus: paymentStatus,
        transactionId: transactionId
      });

      // Send payment notification
      await notificationService.sendPaymentNotification(order, paymentStatus);

      return order;
    } catch (error) {
      logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Get order history for a user
  async getOrderHistory(userId, filters = {}) {
    try {
      const userFilters = { ...filters, userId };
      return await this.getOrders(userFilters);
    } catch (error) {
      logger.error('Error getting order history:', error);
      throw error;
    }
  }

  // Get order analytics
  async getOrderAnalytics(filters = {}) {
    try {
      const { orders: allOrders } = await this.getOrders(filters);
      
      const analytics = {
        totalOrders: allOrders.length,
        totalRevenue: 0,
        statusBreakdown: {},
        paymentStatusBreakdown: {},
        averageOrderValue: 0,
        recentOrders: allOrders.slice(0, 10)
      };

      allOrders.forEach(order => {
        // Calculate revenue
        if (order.status === ORDER_STATUS.COMPLETED) {
          analytics.totalRevenue += order.totalAmount;
        }

        // Status breakdown
        analytics.statusBreakdown[order.status] = (analytics.statusBreakdown[order.status] || 0) + 1;

        // Payment status breakdown
        analytics.paymentStatusBreakdown[order.paymentStatus] = (analytics.paymentStatusBreakdown[order.paymentStatus] || 0) + 1;
      });

      // Calculate average order value
      if (allOrders.length > 0) {
        const totalAmount = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        analytics.averageOrderValue = totalAmount / allOrders.length;
      }

      return analytics;
    } catch (error) {
      logger.error('Error getting order analytics:', error);
      throw error;
    }
  }

  // Get expired orders
  async getExpiredOrders() {
    try {
      const expiredOrders = Array.from(orders.values()).filter(order => 
        order.isExpired() && order.isActive()
      );
      
      return expiredOrders;
    } catch (error) {
      logger.error('Error getting expired orders:', error);
      throw error;
    }
  }

  // Auto-cancel expired orders
  async autoCancelExpiredOrders() {
    try {
      const expiredOrders = await this.getExpiredOrders();
      const cancelledOrders = [];

      for (const order of expiredOrders) {
        try {
          await this.cancelOrder(order.id, 'Auto-cancelled due to timeout', 'system');
          cancelledOrders.push(order.id);
        } catch (error) {
          logger.error(`Failed to auto-cancel order ${order.id}:`, error);
        }
      }

      if (cancelledOrders.length > 0) {
        logger.info(`Auto-cancelled ${cancelledOrders.length} expired orders`, {
          orderIds: cancelledOrders
        });
      }

      return cancelledOrders;
    } catch (error) {
      logger.error('Error in auto-cancellation process:', error);
      throw error;
    }
  }

  // Validate status transition
  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED, ORDER_STATUS.EXPIRED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CANCELLED]: [],
      [ORDER_STATUS.COMPLETED]: [],
      [ORDER_STATUS.EXPIRED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Handle status change notifications
  async handleStatusChangeNotification(order, statusChange) {
    try {
      switch (statusChange.newStatus) {
        case ORDER_STATUS.CONFIRMED:
          await notificationService.sendOrderConfirmed(order);
          break;
        case ORDER_STATUS.CANCELLED:
          await notificationService.sendOrderCancelled(order, statusChange.reason);
          break;
        case ORDER_STATUS.COMPLETED:
          await notificationService.sendOrderCompleted(order);
          break;
        case ORDER_STATUS.EXPIRED:
          await notificationService.sendOrderExpired(order);
          break;
      }
    } catch (error) {
      logger.error('Error sending status change notification:', error);
    }
  }

  // Handle stock restoration (to be integrated with Team Member 2)
  async handleStockRestoration(order) {
    try {
      // This will be integrated with Team Member 2's inventory service
      logger.info('Stock restoration triggered for order', {
        orderId: order.id,
        items: order.items
      });

      // TODO: Call Team Member 2's stock restoration API
      // await inventoryService.restoreStock(order.items);
    } catch (error) {
      logger.error('Error restoring stock:', error);
    }
  }

  // Clean up old completed orders
  async cleanupOldOrders(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const ordersToDelete = Array.from(orders.values()).filter(order => 
        order.status === ORDER_STATUS.COMPLETED && 
        new Date(order.createdAt) < cutoffDate
      );

      ordersToDelete.forEach(order => {
        orders.delete(order.id);
      });

      logger.info(`Cleaned up ${ordersToDelete.length} old completed orders`);
      return ordersToDelete.length;
    } catch (error) {
      logger.error('Error cleaning up old orders:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();
