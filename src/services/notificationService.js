const nodemailer = require('nodemailer');
const twilio = require('twilio');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.isInitialized = false;
  }

  // Initialize notification services
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Notification service already initialized');
      return;
    }

    try {
      // Initialize email transporter
      await this.initializeEmailTransporter();
      
      // Initialize Twilio client
      await this.initializeTwilioClient();

      this.isInitialized = true;
      logger.info('Notification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  // Initialize email transporter
  async initializeEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      await this.emailTransporter.verify();
      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      // Don't throw error, continue without email
    }
  }

  // Initialize Twilio client
  async initializeTwilioClient() {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        logger.info('Twilio client initialized successfully');
      } else {
        logger.warn('Twilio credentials not provided, SMS notifications disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize Twilio client:', error);
      // Don't throw error, continue without SMS
    }
  }

  // Send email notification
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.emailTransporter) {
        logger.warn('Email transporter not available');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: result.messageId, to: to });
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  // Send SMS notification
  async sendSMS(to, message) {
    try {
      if (!this.twilioClient) {
        logger.warn('Twilio client not available');
        return false;
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      logger.info('SMS sent successfully', { messageId: result.sid, to: to });
      return true;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return false;
    }
  }

  // Order confirmation notification
  async sendOrderConfirmation(order) {
    try {
      const subject = `Order Confirmation - #${order.id.slice(0, 8)}`;
      const html = this.generateOrderConfirmationEmail(order);
      const smsMessage = this.generateOrderConfirmationSMS(order);

      // Send email (if user email is available)
      if (order.userEmail) {
        await this.sendEmail(order.userEmail, subject, html);
      }

      // Send SMS (if user phone is available)
      if (order.userPhone) {
        await this.sendSMS(order.userPhone, smsMessage);
      }

      logger.info('Order confirmation notification sent', { orderId: order.id });
    } catch (error) {
      logger.error('Failed to send order confirmation notification:', error);
    }
  }

  // Order confirmed notification
  async sendOrderConfirmed(order) {
    try {
      const subject = `Order Confirmed - #${order.id.slice(0, 8)}`;
      const html = this.generateOrderConfirmedEmail(order);
      const smsMessage = this.generateOrderConfirmedSMS(order);

      if (order.userEmail) {
        await this.sendEmail(order.userEmail, subject, html);
      }

      if (order.userPhone) {
        await this.sendSMS(order.userPhone, smsMessage);
      }

      logger.info('Order confirmed notification sent', { orderId: order.id });
    } catch (error) {
      logger.error('Failed to send order confirmed notification:', error);
    }
  }

  // Order cancelled notification
  async sendOrderCancelled(order, reason) {
    try {
      const subject = `Order Cancelled - #${order.id.slice(0, 8)}`;
      const html = this.generateOrderCancelledEmail(order, reason);
      const smsMessage = this.generateOrderCancelledSMS(order, reason);

      if (order.userEmail) {
        await this.sendEmail(order.userEmail, subject, html);
      }

      if (order.userPhone) {
        await this.sendSMS(order.userPhone, smsMessage);
      }

      logger.info('Order cancelled notification sent', { orderId: order.id, reason });
    } catch (error) {
      logger.error('Failed to send order cancelled notification:', error);
    }
  }

  // Order completed notification
  async sendOrderCompleted(order) {
    try {
      const subject = `Order Ready for Pickup - #${order.id.slice(0, 8)}`;
      const html = this.generateOrderCompletedEmail(order);
      const smsMessage = this.generateOrderCompletedSMS(order);

      if (order.userEmail) {
        await this.sendEmail(order.userEmail, subject, html);
      }

      if (order.userPhone) {
        await this.sendSMS(order.userPhone, smsMessage);
      }

      logger.info('Order completed notification sent', { orderId: order.id });
    } catch (error) {
      logger.error('Failed to send order completed notification:', error);
    }
  }

  // Order expired notification
  async sendOrderExpired(order) {
    try {
      const subject = `Order Expired - #${order.id.slice(0, 8)}`;
      const html = this.generateOrderExpiredEmail(order);
      const smsMessage = this.generateOrderExpiredSMS(order);

      if (order.userEmail) {
        await this.sendEmail(order.userEmail, subject, html);
      }

      if (order.userPhone) {
        await this.sendSMS(order.userPhone, smsMessage);
      }

      logger.info('Order expired notification sent', { orderId: order.id });
    } catch (error) {
      logger.error('Failed to send order expired notification:', error);
    }
  }

  // Payment notification
  async sendPaymentNotification(order, paymentStatus) {
    try {
      const subject = `Payment ${paymentStatus} - #${order.id.slice(0, 8)}`;
      const html = this.generatePaymentNotificationEmail(order, paymentStatus);
      const smsMessage = this.generatePaymentNotificationSMS(order, paymentStatus);

      if (order.userEmail) {
        await this.sendEmail(order.userEmail, subject, html);
      }

      if (order.userPhone) {
        await this.sendSMS(order.userPhone, smsMessage);
      }

      logger.info('Payment notification sent', { orderId: order.id, paymentStatus });
    } catch (error) {
      logger.error('Failed to send payment notification:', error);
    }
  }

  // Generate email templates
  generateOrderConfirmationEmail(order) {
    return `
      <h2>Order Confirmation</h2>
      <p>Thank you for your order!</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Expires at:</strong> ${new Date(order.expiresAt).toLocaleString()}</p>
      <p>Please complete your payment within 15 minutes to confirm your order.</p>
    `;
  }

  generateOrderConfirmedEmail(order) {
    return `
      <h2>Order Confirmed</h2>
      <p>Your order has been confirmed!</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p>We'll notify you when your order is ready for pickup.</p>
    `;
  }

  generateOrderCancelledEmail(order, reason) {
    return `
      <h2>Order Cancelled</h2>
      <p>Your order has been cancelled.</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have any questions, please contact us.</p>
    `;
  }

  generateOrderCompletedEmail(order) {
    return `
      <h2>Order Ready for Pickup</h2>
      <p>Your order is ready for pickup!</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
      <p>Please collect your order from the canteen counter.</p>
    `;
  }

  generateOrderExpiredEmail(order) {
    return `
      <h2>Order Expired</h2>
      <p>Your order has expired due to non-payment.</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p>Please place a new order if you still wish to make a purchase.</p>
    `;
  }

  generatePaymentNotificationEmail(order, paymentStatus) {
    return `
      <h2>Payment ${paymentStatus}</h2>
      <p>Your payment has been ${paymentStatus}.</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Amount:</strong> $${order.totalAmount}</p>
      <p><strong>Status:</strong> ${paymentStatus}</p>
    `;
  }

  // Generate SMS templates
  generateOrderConfirmationSMS(order) {
    return `Order #${order.id.slice(0, 8)} confirmed! Total: $${order.totalAmount}. Complete payment within 15 minutes.`;
  }

  generateOrderConfirmedSMS(order) {
    return `Order #${order.id.slice(0, 8)} confirmed! We'll notify you when ready for pickup.`;
  }

  generateOrderCancelledSMS(order, reason) {
    return `Order #${order.id.slice(0, 8)} cancelled. Reason: ${reason}. Contact us for questions.`;
  }

  generateOrderCompletedSMS(order) {
    return `Order #${order.id.slice(0, 8)} ready for pickup! Collect from canteen counter.`;
  }

  generateOrderExpiredSMS(order) {
    return `Order #${order.id.slice(0, 8)} expired due to non-payment. Place new order if needed.`;
  }

  generatePaymentNotificationSMS(order, paymentStatus) {
    return `Payment ${paymentStatus} for order #${order.id.slice(0, 8)}. Amount: $${order.totalAmount}.`;
  }

  // Utility function to strip HTML tags
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Test notification system
  async testNotification(email = null, phone = null) {
    const testOrder = {
      id: 'test-order-123',
      totalAmount: 25.50,
      status: 'pending',
      userEmail: email,
      userPhone: phone
    };

    const results = {
      email: false,
      sms: false
    };

    if (email) {
      results.email = await this.sendEmail(email, 'Test Notification', 'This is a test notification from the canteen ordering system.');
    }

    if (phone) {
      results.sms = await this.sendSMS(phone, 'Test SMS notification from canteen ordering system.');
    }

    return results;
  }

  // Get notification service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      emailAvailable: !!this.emailTransporter,
      smsAvailable: !!this.twilioClient
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Initialize function for external use
async function initializeNotificationService() {
  return await notificationService.initialize();
}

module.exports = {
  notificationService,
  initializeNotificationService
};
