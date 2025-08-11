const express = require("express");
const router = express.Router();
const inventoryService = require("../services/inventoryService");
const { validateMenuItemStock } = require("../middleware/stockValidation");
const logger = require("../utils/logger");

/**
 * @route   GET /api/inventory/stock
 * @desc    Get real-time stock information for all menu items
 * @access  Public
 */
router.get("/stock", async (req, res) => {
  try {
    const stockInfo = await inventoryService.getRealTimeStockInfo();

    res.json({
      success: true,
      data: stockInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching stock information:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stock information",
    });
  }
});

/**
 * @route   GET /api/inventory/stock/:menuItemId
 * @desc    Get stock information for a specific menu item
 * @access  Public
 */
router.get("/stock/:menuItemId", async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const availableStock = await inventoryService.getAvailableStock(menuItemId);
    const lockedStock = await inventoryService.getLockedStock(menuItemId);

    res.json({
      success: true,
      data: {
        menuItemId,
        availableStock,
        lockedStock,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching menu item stock:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching menu item stock",
    });
  }
});

/**
 * @route   POST /api/inventory/lock
 * @desc    Lock stock for an order (called when order is placed)
 * @access  Private (requires order context)
 */
router.post("/lock", async (req, res) => {
  try {
    const { orderId, items } = req.body;

    if (!orderId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Order ID and items array are required",
      });
    }

    const lockResults = [];

    // Lock stock for each item
    for (const item of items) {
      const { menuItemId, quantity } = item;

      try {
        await inventoryService.lockStock(menuItemId, quantity, orderId);
        lockResults.push({
          menuItemId,
          quantity,
          status: "locked",
        });
      } catch (error) {
        // If any item fails to lock, release all previous locks
        await inventoryService.releaseStockLock(orderId);

        return res.status(400).json({
          success: false,
          message: `Failed to lock stock: ${error.message}`,
          failedItem: { menuItemId, quantity },
        });
      }
    }

    res.json({
      success: true,
      message: "Stock locked successfully",
      data: {
        orderId,
        lockedItems: lockResults,
      },
    });
  } catch (error) {
    logger.error("Error locking stock:", error);
    res.status(500).json({
      success: false,
      message: "Error locking stock",
    });
  }
});

/**
 * @route   POST /api/inventory/release
 * @desc    Release stock lock for an order (called when order is cancelled)
 * @access  Private (requires order context)
 */
router.post("/release", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    await inventoryService.releaseStockLock(orderId);

    res.json({
      success: true,
      message: "Stock lock released successfully",
      data: { orderId },
    });
  } catch (error) {
    logger.error("Error releasing stock lock:", error);
    res.status(500).json({
      success: false,
      message: "Error releasing stock lock",
    });
  }
});

/**
 * @route   POST /api/inventory/confirm
 * @desc    Confirm stock lock and reduce actual stock (called when order is confirmed)
 * @access  Private (requires order context)
 */
router.post("/confirm", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    await inventoryService.confirmStockLock(orderId);

    res.json({
      success: true,
      message: "Stock confirmed and reduced successfully",
      data: { orderId },
    });
  } catch (error) {
    logger.error("Error confirming stock lock:", error);
    res.status(500).json({
      success: false,
      message: "Error confirming stock lock",
    });
  }
});

/**
 * @route   PUT /api/inventory/stock/:menuItemId
 * @desc    Update stock count for a menu item (admin function)
 * @access  Private (admin only)
 */
router.put("/stock/:menuItemId", validateMenuItemStock, async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { newStockCount } = req.body;

    if (newStockCount === undefined || newStockCount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid new stock count is required",
      });
    }

    const updatedItem = await inventoryService.updateStockCount(
      menuItemId,
      newStockCount
    );

    res.json({
      success: true,
      message: "Stock count updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    logger.error("Error updating stock count:", error);
    res.status(500).json({
      success: false,
      message: "Error updating stock count",
    });
  }
});

/**
 * @route   POST /api/inventory/cleanup
 * @desc    Clean up expired stock locks (admin function)
 * @access  Private (admin only)
 */
router.post("/cleanup", async (req, res) => {
  try {
    const cleanedCount = await inventoryService.cleanupExpiredLocks();

    res.json({
      success: true,
      message: "Expired stock locks cleaned up successfully",
      data: {
        cleanedCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error cleaning up expired locks:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up expired locks",
    });
  }
});

/**
 * @route   GET /api/inventory/locks
 * @desc    Get all active stock locks (admin function)
 * @access  Private (admin only)
 */
router.get("/locks", async (req, res) => {
  try {
    const db = require("../config/database");

    const activeLocks = await db.stockLock().findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            stockCount: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lockedAt: "desc",
      },
    });

    res.json({
      success: true,
      data: activeLocks,
      count: activeLocks.length,
    });
  } catch (error) {
    logger.error("Error fetching active locks:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active locks",
    });
  }
});

module.exports = router;
