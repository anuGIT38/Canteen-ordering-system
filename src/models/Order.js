const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Order status enum
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};

// Payment status enum
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

class Order {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.items = data.items || [];
    this.status = data.status || ORDER_STATUS.PENDING;
    this.paymentStatus = data.paymentStatus || PAYMENT_STATUS.PENDING;
    this.totalAmount = data.totalAmount || 0;
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.expiresAt = data.expiresAt || this.calculateExpiryTime();
    this.pickupTime = data.pickupTime || null;
    this.cancelledAt = data.cancelledAt || null;
    this.cancelledBy = data.cancelledBy || null;
    this.cancellationReason = data.cancellationReason || null;
    this.paymentMethod = data.paymentMethod || null;
    this.paymentTransactionId = data.paymentTransactionId || null;
  }

  // Calculate expiry time (15 minutes from creation)
  calculateExpiryTime() {
    const timeoutMinutes = parseInt(process.env.ORDER_TIMEOUT_MINUTES) || 15;
    return moment().add(timeoutMinutes, 'minutes').toDate();
  }

  // Check if order is expired
  isExpired() {
    return moment().isAfter(this.expiresAt);
  }

  // Check if order can be cancelled
  canBeCancelled() {
    return [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(this.status);
  }

  // Check if order is active (not cancelled or completed)
  isActive() {
    return ![ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED, ORDER_STATUS.EXPIRED].includes(this.status);
  }

  // Get time remaining until expiry
  getTimeRemaining() {
    if (this.isExpired()) {
      return 0;
    }
    return moment(this.expiresAt).diff(moment(), 'seconds');
  }

  // Update order status
  updateStatus(newStatus, reason = null, updatedBy = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus === ORDER_STATUS.CANCELLED) {
      this.cancelledAt = new Date();
      this.cancelledBy = updatedBy;
      this.cancellationReason = reason;
    }

    return {
      oldStatus,
      newStatus,
      reason
    };
  }

  // Update payment status
  updatePaymentStatus(newPaymentStatus, transactionId = null) {
    this.paymentStatus = newPaymentStatus;
    this.paymentTransactionId = transactionId;
    this.updatedAt = new Date();
  }

  // Add item to order
  addItem(item) {
    this.items.push(item);
    this.calculateTotal();
  }

  // Remove item from order
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.calculateTotal();
  }

  // Calculate total amount
  calculateTotal() {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.unitPrice * item.quantity);
    }, 0);
  }

  // Get order summary
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      status: this.status,
      paymentStatus: this.paymentStatus,
      totalAmount: this.totalAmount,
      itemCount: this.items.length,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      timeRemaining: this.getTimeRemaining(),
      isExpired: this.isExpired()
    };
  }

  // Convert to database format
  toDatabaseFormat() {
    return {
      id: this.id,
      user_id: this.userId,
      status: this.status,
      payment_status: this.paymentStatus,
      total_amount: this.totalAmount,
      notes: this.notes,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      expires_at: this.expiresAt,
      pickup_time: this.pickupTime,
      cancelled_at: this.cancelledAt,
      cancelled_by: this.cancelledBy,
      cancellation_reason: this.cancellationReason,
      payment_method: this.paymentMethod,
      payment_transaction_id: this.paymentTransactionId
    };
  }

  // Create from database format
  static fromDatabaseFormat(data) {
    return new Order({
      id: data.id,
      userId: data.user_id,
      status: data.status,
      paymentStatus: data.payment_status,
      totalAmount: data.total_amount,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: data.expires_at,
      pickupTime: data.pickup_time,
      cancelledAt: data.cancelled_at,
      cancelledBy: data.cancelled_by,
      cancellationReason: data.cancellation_reason,
      paymentMethod: data.payment_method,
      paymentTransactionId: data.payment_transaction_id
    });
  }

  // Validate order data
  static validate(data) {
    const errors = [];

    if (!data.userId) {
      errors.push('User ID is required');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    if (data.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = {
  Order,
  ORDER_STATUS,
  PAYMENT_STATUS
};
