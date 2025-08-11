const cron = require("node-cron");
const inventoryService = require("./inventoryService");
const websocketService = require("./websocketService");
const logger = require("../utils/logger");

class SchedulerService {
  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initialize all scheduled tasks
   */
  initialize() {
    this.scheduleExpiredLockCleanup();
    this.scheduleStockHealthCheck();
    this.scheduleWebSocketHealthCheck();
    logger.info("Scheduler service initialized");
  }

  /**
   * Schedule cleanup of expired stock locks (every 5 minutes)
   */
  scheduleExpiredLockCleanup() {
    const task = cron.schedule(
      "*/5 * * * *",
      async () => {
        try {
          logger.info("Starting expired stock lock cleanup...");
          const cleanedCount = await inventoryService.cleanupExpiredLocks();

          if (cleanedCount > 0) {
            // Broadcast notification about cleanup
            websocketService.broadcastNotification({
              type: "cleanup",
              message: `${cleanedCount} expired stock locks cleaned up`,
              cleanedCount,
            });

            // Broadcast updated stock information
            const stockInfo = await inventoryService.getRealTimeStockInfo();
            websocketService.broadcastStockUpdate(stockInfo);
          }

          logger.info(
            `Expired lock cleanup completed. Cleaned: ${cleanedCount}`
          );
        } catch (error) {
          logger.error("Error during expired lock cleanup:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    this.tasks.set("expiredLockCleanup", task);
    task.start();
    logger.info("Expired lock cleanup scheduled (every 5 minutes)");
  }

  /**
   * Schedule stock health check (every 10 minutes)
   */
  scheduleStockHealthCheck() {
    const task = cron.schedule(
      "*/10 * * * *",
      async () => {
        try {
          logger.info("Starting stock health check...");
          const stockInfo = await inventoryService.getRealTimeStockInfo();

          // Check for items with low stock (less than 5 items)
          const lowStockItems = stockInfo.filter(
            (item) => item.availableStock < 5 && item.availableStock > 0
          );

          if (lowStockItems.length > 0) {
            // Send notification to admin room
            websocketService.sendStockUpdateToRoom("admin", {
              type: "low-stock-alert",
              items: lowStockItems,
              message: `${lowStockItems.length} items are running low on stock`,
            });

            logger.warn(`Low stock alert: ${lowStockItems.length} items`);
          }

          // Check for out-of-stock items
          const outOfStockItems = stockInfo.filter(
            (item) => item.availableStock === 0
          );

          if (outOfStockItems.length > 0) {
            websocketService.sendStockUpdateToRoom("admin", {
              type: "out-of-stock-alert",
              items: outOfStockItems,
              message: `${outOfStockItems.length} items are out of stock`,
            });

            logger.warn(`Out of stock alert: ${outOfStockItems.length} items`);
          }

          // Broadcast general stock update
          websocketService.broadcastStockUpdate(stockInfo);

          logger.info("Stock health check completed");
        } catch (error) {
          logger.error("Error during stock health check:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    this.tasks.set("stockHealthCheck", task);
    task.start();
    logger.info("Stock health check scheduled (every 10 minutes)");
  }

  /**
   * Schedule WebSocket health check (every 30 seconds)
   */
  scheduleWebSocketHealthCheck() {
    const task = cron.schedule(
      "*/30 * * * * *",
      async () => {
        try {
          const connectedClients = websocketService.getConnectedClientsCount();

          if (connectedClients > 0) {
            logger.debug(
              `WebSocket health check: ${connectedClients} clients connected`
            );
          }
        } catch (error) {
          logger.error("Error during WebSocket health check:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    this.tasks.set("websocketHealthCheck", task);
    task.start();
    logger.info("WebSocket health check scheduled (every 30 seconds)");
  }

  /**
   * Schedule custom task
   * @param {string} name - Task name
   * @param {string} schedule - Cron schedule expression
   * @param {Function} taskFunction - Function to execute
   */
  scheduleCustomTask(name, schedule, taskFunction) {
    if (this.tasks.has(name)) {
      logger.warn(`Task ${name} already exists. Stopping existing task.`);
      this.stopTask(name);
    }

    const task = cron.schedule(
      schedule,
      async () => {
        try {
          await taskFunction();
        } catch (error) {
          logger.error(`Error in custom task ${name}:`, error);
        }
      },
      {
        scheduled: false,
      }
    );

    this.tasks.set(name, task);
    task.start();
    logger.info(`Custom task ${name} scheduled: ${schedule}`);
  }

  /**
   * Stop a specific task
   * @param {string} name - Task name
   */
  stopTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      logger.info(`Task ${name} stopped`);
    } else {
      logger.warn(`Task ${name} not found`);
    }
  }

  /**
   * Stop all tasks
   */
  stopAllTasks() {
    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`Task ${name} stopped`);
    }
    this.tasks.clear();
    logger.info("All scheduled tasks stopped");
  }

  /**
   * Get all active tasks
   * @returns {Array} Array of task names
   */
  getActiveTasks() {
    return Array.from(this.tasks.keys());
  }

  /**
   * Get task status
   * @param {string} name - Task name
   * @returns {boolean} Task running status
   */
  isTaskRunning(name) {
    const task = this.tasks.get(name);
    return task ? task.running : false;
  }

  /**
   * Manually trigger expired lock cleanup
   */
  async triggerExpiredLockCleanup() {
    try {
      logger.info("Manually triggering expired lock cleanup...");
      const cleanedCount = await inventoryService.cleanupExpiredLocks();

      if (cleanedCount > 0) {
        websocketService.broadcastNotification({
          type: "manual-cleanup",
          message: `${cleanedCount} expired stock locks cleaned up manually`,
          cleanedCount,
        });
      }

      return cleanedCount;
    } catch (error) {
      logger.error("Error during manual cleanup:", error);
      throw error;
    }
  }

  /**
   * Manually trigger stock health check
   */
  async triggerStockHealthCheck() {
    try {
      logger.info("Manually triggering stock health check...");
      const stockInfo = await inventoryService.getRealTimeStockInfo();

      websocketService.broadcastStockUpdate(stockInfo);

      return stockInfo;
    } catch (error) {
      logger.error("Error during manual stock health check:", error);
      throw error;
    }
  }
}

module.exports = new SchedulerService();
