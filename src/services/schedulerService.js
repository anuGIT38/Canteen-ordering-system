const cron = require('node-cron');
const logger = require('../utils/logger');
const orderService = require('./orderService');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  // Initialize all scheduled jobs
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      // Auto-cancellation job
      this.scheduleAutoCancellation();
      
      // Cleanup job
      this.scheduleCleanup();
      
      // Health check job
      this.scheduleHealthCheck();

      this.isInitialized = true;
      logger.info('Scheduler service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler service:', error);
      throw error;
    }
  }

  // Schedule auto-cancellation job
  scheduleAutoCancellation() {
    const interval = process.env.AUTO_CANCELLATION_CHECK_INTERVAL || 1;
    
    // Run every X minutes
    const cronExpression = `*/${interval} * * * *`;
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        logger.debug('Running auto-cancellation job');
        const cancelledOrders = await orderService.autoCancelExpiredOrders();
        
        if (cancelledOrders.length > 0) {
          logger.info(`Auto-cancellation job completed: ${cancelledOrders.length} orders cancelled`);
        }
      } catch (error) {
        logger.error('Error in auto-cancellation job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('autoCancellation', job);
    job.start();
    
    logger.info(`Auto-cancellation job scheduled to run every ${interval} minute(s)`);
  }

  // Schedule cleanup job
  scheduleCleanup() {
    // Run daily at 2 AM UTC
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        logger.debug('Running cleanup job');
        const deletedCount = await orderService.cleanupOldOrders(30); // Keep 30 days
        
        if (deletedCount > 0) {
          logger.info(`Cleanup job completed: ${deletedCount} old orders removed`);
        }
      } catch (error) {
        logger.error('Error in cleanup job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('cleanup', job);
    job.start();
    
    logger.info('Cleanup job scheduled to run daily at 2 AM UTC');
  }

  // Schedule health check job
  scheduleHealthCheck() {
    // Run every 5 minutes
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.debug('Running health check job');
        
        // Check if orders are being processed correctly
        const { orders } = await orderService.getOrders({ limit: 1 });
        
        // Check for stuck orders (pending for more than 20 minutes)
        const stuckOrders = await this.checkForStuckOrders();
        
        if (stuckOrders.length > 0) {
          logger.warn(`Found ${stuckOrders.length} potentially stuck orders`, {
            orderIds: stuckOrders.map(o => o.id)
          });
        }
        
        logger.debug('Health check job completed successfully');
      } catch (error) {
        logger.error('Error in health check job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.jobs.set('healthCheck', job);
    job.start();
    
    logger.info('Health check job scheduled to run every 5 minutes');
  }

  // Check for stuck orders
  async checkForStuckOrders() {
    try {
      const { orders } = await orderService.getOrders({ status: 'pending' });
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      
      return orders.filter(order => 
        new Date(order.createdAt) < twentyMinutesAgo
      );
    } catch (error) {
      logger.error('Error checking for stuck orders:', error);
      return [];
    }
  }

  // Manually trigger auto-cancellation
  async triggerAutoCancellation() {
    try {
      logger.info('Manually triggering auto-cancellation');
      const cancelledOrders = await orderService.autoCancelExpiredOrders();
      
      return {
        success: true,
        cancelledCount: cancelledOrders.length,
        cancelledOrderIds: cancelledOrders
      };
    } catch (error) {
      logger.error('Error in manual auto-cancellation:', error);
      throw error;
    }
  }

  // Manually trigger cleanup
  async triggerCleanup() {
    try {
      logger.info('Manually triggering cleanup');
      const deletedCount = await orderService.cleanupOldOrders(30);
      
      return {
        success: true,
        deletedCount: deletedCount
      };
    } catch (error) {
      logger.error('Error in manual cleanup:', error);
      throw error;
    }
  }

  // Get scheduler status
  getStatus() {
    const status = {
      isInitialized: this.isInitialized,
      jobs: {}
    };

    for (const [jobName, job] of this.jobs) {
      status.jobs[jobName] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate()
      };
    }

    return status;
  }

  // Stop a specific job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      logger.info(`Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }

  // Start a specific job
  startJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      logger.info(`Started job: ${jobName}`);
      return true;
    }
    return false;
  }

  // Stop all jobs
  stopAllJobs() {
    for (const [jobName, job] of this.jobs) {
      job.stop();
      logger.info(`Stopped job: ${jobName}`);
    }
  }

  // Restart all jobs
  restartAllJobs() {
    this.stopAllJobs();
    
    // Re-initialize
    this.isInitialized = false;
    this.jobs.clear();
    
    return this.initialize();
  }

  // Add custom job
  addCustomJob(name, cronExpression, task) {
    try {
      const job = cron.schedule(cronExpression, task, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.jobs.set(name, job);
      job.start();
      
      logger.info(`Custom job '${name}' scheduled with expression: ${cronExpression}`);
      return true;
    } catch (error) {
      logger.error(`Failed to add custom job '${name}':`, error);
      return false;
    }
  }

  // Remove custom job
  removeCustomJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info(`Removed custom job: ${name}`);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

// Initialize function for external use
async function initializeScheduler() {
  return await schedulerService.initialize();
}

module.exports = {
  schedulerService,
  initializeScheduler
};
