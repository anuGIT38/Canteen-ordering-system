const Bull = require('bull');
const Redis = require('ioredis');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.redis = null;
    this.queues = new Map();
    this.isInitialized = false;
  }

  // Initialize queue service
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Queue service already initialized');
      return;
    }

    try {
      // Initialize Redis connection
      await this.initializeRedis();
      
      // Initialize queues
      await this.initializeQueues();

      this.isInitialized = true;
      logger.info('Queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  // Initialize Redis connection
  async initializeRedis() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      // Test connection
      await this.redis.ping();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  // Initialize all queues
  async initializeQueues() {
    try {
      // Order processing queue
      this.createQueue('orderProcessing', this.processOrderJob);
      
      // Notification queue
      this.createQueue('notifications', this.processNotificationJob);
      
      // Cleanup queue
      this.createQueue('cleanup', this.processCleanupJob);
      
      // Payment processing queue
      this.createQueue('paymentProcessing', this.processPaymentJob);

      logger.info('All queues initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queues:', error);
      throw error;
    }
  }

  // Create a new queue
  createQueue(name, processor) {
    try {
      const queue = new Bull(name, process.env.REDIS_URL || 'redis://localhost:6379', {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      // Process jobs
      queue.process(processor.bind(this));

      // Handle events
      this.setupQueueEvents(queue, name);

      this.queues.set(name, queue);
      logger.info(`Queue '${name}' created successfully`);
      
      return queue;
    } catch (error) {
      logger.error(`Failed to create queue '${name}':`, error);
      throw error;
    }
  }

  // Setup queue events
  setupQueueEvents(queue, name) {
    queue.on('completed', (job, result) => {
      logger.info(`Job completed in queue '${name}'`, {
        jobId: job.id,
        result: result
      });
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job failed in queue '${name}'`, {
        jobId: job.id,
        error: err.message,
        data: job.data
      });
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job stalled in queue '${name}'`, {
        jobId: job.id
      });
    });

    queue.on('error', (error) => {
      logger.error(`Queue error in '${name}':`, error);
    });
  }

  // Add job to queue
  async addJob(queueName, data, options = {}) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const job = await queue.add(data, options);
      logger.info(`Job added to queue '${queueName}'`, {
        jobId: job.id,
        data: data
      });

      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue '${queueName}':`, error);
      throw error;
    }
  }

  // Process order job
  async processOrderJob(job) {
    try {
      const { orderId, action } = job.data;
      logger.info(`Processing order job`, { orderId, action });

      // Import here to avoid circular dependency
      const orderService = require('./orderService');

      switch (action) {
        case 'autoCancel':
          await orderService.autoCancelExpiredOrders();
          break;
        case 'updateStatus':
          const { newStatus, reason, updatedBy } = job.data;
          await orderService.updateOrderStatus(orderId, newStatus, reason, updatedBy);
          break;
        case 'cleanup':
          await orderService.cleanupOldOrders();
          break;
        default:
          throw new Error(`Unknown order action: ${action}`);
      }

      return { success: true, orderId, action };
    } catch (error) {
      logger.error('Error processing order job:', error);
      throw error;
    }
  }

  // Process notification job
  async processNotificationJob(job) {
    try {
      const { type, data } = job.data;
      logger.info(`Processing notification job`, { type });

      // Import here to avoid circular dependency
      const { notificationService } = require('./notificationService');

      switch (type) {
        case 'orderConfirmation':
          await notificationService.sendOrderConfirmation(data);
          break;
        case 'orderConfirmed':
          await notificationService.sendOrderConfirmed(data);
          break;
        case 'orderCancelled':
          await notificationService.sendOrderCancelled(data.order, data.reason);
          break;
        case 'orderCompleted':
          await notificationService.sendOrderCompleted(data);
          break;
        case 'orderExpired':
          await notificationService.sendOrderExpired(data);
          break;
        case 'paymentNotification':
          await notificationService.sendPaymentNotification(data.order, data.paymentStatus);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      return { success: true, type };
    } catch (error) {
      logger.error('Error processing notification job:', error);
      throw error;
    }
  }

  // Process cleanup job
  async processCleanupJob(job) {
    try {
      const { type } = job.data;
      logger.info(`Processing cleanup job`, { type });

      // Import here to avoid circular dependency
      const orderService = require('./orderService');

      switch (type) {
        case 'oldOrders':
          const deletedCount = await orderService.cleanupOldOrders();
          return { success: true, deletedCount };
        case 'failedJobs':
          // Clean up failed jobs older than 24 hours
          const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
          for (const [queueName, queue] of this.queues) {
            const failedJobs = await queue.getFailed();
            for (const failedJob of failedJobs) {
              if (failedJob.finishedOn < cutoffTime) {
                await failedJob.remove();
              }
            }
          }
          return { success: true, type: 'failedJobs' };
        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }
    } catch (error) {
      logger.error('Error processing cleanup job:', error);
      throw error;
    }
  }

  // Process payment job
  async processPaymentJob(job) {
    try {
      const { orderId, paymentData } = job.data;
      logger.info(`Processing payment job`, { orderId });

      // Import here to avoid circular dependency
      const orderService = require('./orderService');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      const paymentStatus = Math.random() > 0.1 ? 'paid' : 'failed'; // 90% success rate
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await orderService.updatePaymentStatus(orderId, paymentStatus, transactionId);

      return { success: true, orderId, paymentStatus, transactionId };
    } catch (error) {
      logger.error('Error processing payment job:', error);
      throw error;
    }
  }

  // Get queue status
  async getQueueStatus(queueName) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const [
        waiting,
        active,
        completed,
        failed,
        delayed
      ] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed()
      ]);

      return {
        name: queueName,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
    } catch (error) {
      logger.error(`Failed to get queue status for '${queueName}':`, error);
      throw error;
    }
  }

  // Get all queues status
  async getAllQueuesStatus() {
    try {
      const statuses = [];
      for (const [queueName] of this.queues) {
        const status = await this.getQueueStatus(queueName);
        statuses.push(status);
      }
      return statuses;
    } catch (error) {
      logger.error('Failed to get all queues status:', error);
      throw error;
    }
  }

  // Pause queue
  async pauseQueue(queueName) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      await queue.pause();
      logger.info(`Queue '${queueName}' paused`);
      return true;
    } catch (error) {
      logger.error(`Failed to pause queue '${queueName}':`, error);
      throw error;
    }
  }

  // Resume queue
  async resumeQueue(queueName) {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      await queue.resume();
      logger.info(`Queue '${queueName}' resumed`);
      return true;
    } catch (error) {
      logger.error(`Failed to resume queue '${queueName}':`, error);
      throw error;
    }
  }

  // Clean queue
  async cleanQueue(queueName, grace = 1000 * 60 * 60 * 24) { // 24 hours default
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      logger.info(`Queue '${queueName}' cleaned`);
      return true;
    } catch (error) {
      logger.error(`Failed to clean queue '${queueName}':`, error);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      redisConnected: !!this.redis,
      queuesCount: this.queues.size,
      queueNames: Array.from(this.queues.keys())
    };
  }

  // Graceful shutdown
  async shutdown() {
    try {
      logger.info('Shutting down queue service...');
      
      // Close all queues
      for (const [queueName, queue] of this.queues) {
        await queue.close();
        logger.info(`Queue '${queueName}' closed`);
      }

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
        logger.info('Redis connection closed');
      }

      this.isInitialized = false;
      logger.info('Queue service shutdown completed');
    } catch (error) {
      logger.error('Error during queue service shutdown:', error);
      throw error;
    }
  }
}

// Create singleton instance
const queueService = new QueueService();

// Initialize function for external use
async function initializeQueue() {
  return await queueService.initialize();
}

module.exports = {
  queueService,
  initializeQueue
};
