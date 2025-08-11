const db = require("../config/database");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

class InventoryService {
  constructor() {
    this.stockLockTimeout = parseInt(process.env.STOCK_LOCK_TIMEOUT) || 900000; // 15 minutes
    this.stockLockPrefix = process.env.STOCK_LOCK_PREFIX || "stock_lock:";
  }

  /**
   * Lock stock for a menu item when an order is placed
   * @param {string} menuItemId - The menu item ID
   * @param {number} quantity - Quantity to lock
   * @param {string} orderId - The order ID
   * @returns {Promise<boolean>} - Success status
   */
  async lockStock(menuItemId, quantity, orderId) {
    const lockKey = `${this.stockLockPrefix}${menuItemId}`;

    try {
      // Use database transaction for atomicity
      const result = await db.transaction(async (tx) => {
        // Get current stock count
        const menuItem = await tx.menuItem().findUnique({
          where: { id: menuItemId },
          select: { stockCount: true, name: true },
        });

        if (!menuItem) {
          throw new Error("Menu item not found");
        }

        // Check if enough stock is available
        const availableStock =
          menuItem.stockCount - (await this.getLockedStock(menuItemId));

        if (availableStock < quantity) {
          throw new Error(
            `Insufficient stock for ${menuItem.name}. Available: ${availableStock}, Requested: ${quantity}`
          );
        }

        // Create stock lock record
        const stockLock = await tx.stockLock().create({
          data: {
            orderId,
            menuItemId,
            quantity,
            expiresAt: new Date(Date.now() + this.stockLockTimeout),
          },
        });

        // Cache the lock in Redis for faster access
        await redisClient.setEx(
          `${lockKey}:${orderId}`,
          this.stockLockTimeout / 1000,
          JSON.stringify({
            quantity,
            lockedAt: stockLock.lockedAt,
            expiresAt: stockLock.expiresAt,
          })
        );

        logger.info(
          `Stock locked: ${quantity} units of ${menuItem.name} for order ${orderId}`
        );
        return true;
      });

      return result;
    } catch (error) {
      logger.error("Error locking stock:", error);
      throw error;
    }
  }

  /**
   * Release stock lock when order is cancelled or expires
   * @param {string} orderId - The order ID
   * @returns {Promise<boolean>} - Success status
   */
  async releaseStockLock(orderId) {
    try {
      const result = await db.transaction(async (tx) => {
        // Get all stock locks for this order
        const stockLocks = await tx.stockLock().findMany({
          where: {
            orderId,
            isActive: true,
          },
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        });

        if (stockLocks.length === 0) {
          logger.warn(`No active stock locks found for order ${orderId}`);
          return true;
        }

        // Deactivate all stock locks for this order
        await tx.stockLock().updateMany({
          where: { orderId },
          data: { isActive: false },
        });

        // Remove from Redis cache
        for (const lock of stockLocks) {
          const lockKey = `${this.stockLockPrefix}${lock.menuItemId}:${orderId}`;
          await redisClient.del(lockKey);
          logger.info(
            `Stock lock released: ${lock.quantity} units of ${lock.menuItem.name} for order ${orderId}`
          );
        }

        return true;
      });

      return result;
    } catch (error) {
      logger.error("Error releasing stock lock:", error);
      throw error;
    }
  }

  /**
   * Confirm stock lock and reduce actual stock when order is confirmed
   * @param {string} orderId - The order ID
   * @returns {Promise<boolean>} - Success status
   */
  async confirmStockLock(orderId) {
    try {
      const result = await db.transaction(async (tx) => {
        // Get all stock locks for this order
        const stockLocks = await tx.stockLock().findMany({
          where: {
            orderId,
            isActive: true,
          },
          include: {
            menuItem: {
              select: { id: true, name: true, stockCount: true },
            },
          },
        });

        if (stockLocks.length === 0) {
          throw new Error(`No active stock locks found for order ${orderId}`);
        }

        // Update stock counts and deactivate locks
        for (const lock of stockLocks) {
          await tx.menuItem().update({
            where: { id: lock.menuItemId },
            data: {
              stockCount: {
                decrement: lock.quantity,
              },
            },
          });

          await tx.stockLock().update({
            where: { id: lock.id },
            data: { isActive: false },
          });

          // Remove from Redis cache
          const lockKey = `${this.stockLockPrefix}${lock.menuItemId}:${orderId}`;
          await redisClient.del(lockKey);

          logger.info(
            `Stock confirmed: ${lock.quantity} units of ${lock.menuItem.name} for order ${orderId}`
          );
        }

        return true;
      });

      return result;
    } catch (error) {
      logger.error("Error confirming stock lock:", error);
      throw error;
    }
  }

  /**
   * Get current available stock for a menu item
   * @param {string} menuItemId - The menu item ID
   * @returns {Promise<number>} - Available stock count
   */
  async getAvailableStock(menuItemId) {
    try {
      const menuItem = await db.menuItem().findUnique({
        where: { id: menuItemId },
        select: { stockCount: true },
      });

      if (!menuItem) {
        throw new Error("Menu item not found");
      }

      const lockedStock = await this.getLockedStock(menuItemId);
      return Math.max(0, menuItem.stockCount - lockedStock);
    } catch (error) {
      logger.error("Error getting available stock:", error);
      throw error;
    }
  }

  /**
   * Get total locked stock for a menu item
   * @param {string} menuItemId - The menu item ID
   * @returns {Promise<number>} - Locked stock count
   */
  async getLockedStock(menuItemId) {
    try {
      const lockedStock = await db.stockLock().findMany({
        where: {
          menuItemId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // Calculate sum manually since aggregate is not available in placeholder
      const totalLocked = lockedStock.reduce(
        (sum, lock) => sum + lock.quantity,
        0
      );

      return totalLocked;
    } catch (error) {
      logger.error("Error getting locked stock:", error);
      throw error;
    }
  }

  /**
   * Update stock count for a menu item (admin function)
   * @param {string} menuItemId - The menu item ID
   * @param {number} newStockCount - New stock count
   * @returns {Promise<Object>} - Updated menu item
   */
  async updateStockCount(menuItemId, newStockCount) {
    try {
      if (newStockCount < 0) {
        throw new Error("Stock count cannot be negative");
      }

      const updatedItem = await db.menuItem().update({
        where: { id: menuItemId },
        data: { stockCount: newStockCount },
        select: {
          id: true,
          name: true,
          stockCount: true,
          isAvailable: true,
        },
      });

      // Update availability based on stock
      if (newStockCount === 0 && updatedItem.isAvailable) {
        await db.menuItem().update({
          where: { id: menuItemId },
          data: { isAvailable: false },
        });
      } else if (newStockCount > 0 && !updatedItem.isAvailable) {
        await db.menuItem().update({
          where: { id: menuItemId },
          data: { isAvailable: true },
        });
      }

      logger.info(`Stock updated for ${updatedItem.name}: ${newStockCount}`);
      return updatedItem;
    } catch (error) {
      logger.error("Error updating stock count:", error);
      throw error;
    }
  }

  /**
   * Clean up expired stock locks
   * @returns {Promise<number>} - Number of expired locks cleaned up
   */
  async cleanupExpiredLocks() {
    try {
      const result = await db.stockLock().findMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // Update expired locks manually since updateMany is not available in placeholder
      let updatedCount = 0;
      for (const lock of result) {
        await db.stockLock().update({
          where: { id: lock.id },
          data: { isActive: false },
        });
        updatedCount++;
      }

      if (updatedCount > 0) {
        logger.info(`Cleaned up ${updatedCount} expired stock locks`);
      }

      return updatedCount;
    } catch (error) {
      logger.error("Error cleaning up expired locks:", error);
      throw error;
    }
  }

  /**
   * Get real-time stock information for all menu items
   * @returns {Promise<Array>} - Array of menu items with stock info
   */
  async getRealTimeStockInfo() {
    try {
      const menuItems = await db.menuItem().findMany({
        select: {
          id: true,
          name: true,
          stockCount: true,
          isAvailable: true,
          category: true,
          price: true,
        },
      });

      const stockInfo = await Promise.all(
        menuItems.map(async (item) => {
          const lockedStock = await this.getLockedStock(item.id);
          const availableStock = Math.max(0, item.stockCount - lockedStock);

          return {
            ...item,
            availableStock,
            lockedStock,
          };
        })
      );

      return stockInfo;
    } catch (error) {
      logger.error("Error getting real-time stock info:", error);
      throw error;
    }
  }
}

module.exports = new InventoryService();
