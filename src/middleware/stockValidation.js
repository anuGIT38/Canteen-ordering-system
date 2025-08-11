const inventoryService = require("../services/inventoryService");
const logger = require("../utils/logger");

/**
 * Middleware to validate stock availability before order placement
 */
const validateStockAvailability = async (req, res, next) => {
  try {
    const { orderItems } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required and must be an array",
      });
    }

    const stockValidationResults = [];

    // Validate stock for each item
    for (const item of orderItems) {
      const { menuItemId, quantity } = item;

      if (!menuItemId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Each order item must have a valid menuItemId and quantity > 0",
        });
      }

      try {
        const availableStock = await inventoryService.getAvailableStock(
          menuItemId
        );

        if (availableStock < quantity) {
          stockValidationResults.push({
            menuItemId,
            requestedQuantity: quantity,
            availableStock,
            isAvailable: false,
          });
        } else {
          stockValidationResults.push({
            menuItemId,
            requestedQuantity: quantity,
            availableStock,
            isAvailable: true,
          });
        }
      } catch (error) {
        logger.error(
          `Error validating stock for menu item ${menuItemId}:`,
          error
        );
        return res.status(500).json({
          success: false,
          message: "Error validating stock availability",
        });
      }
    }

    // Check if any items have insufficient stock
    const unavailableItems = stockValidationResults.filter(
      (item) => !item.isAvailable
    );

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items have insufficient stock",
        unavailableItems,
      });
    }

    // Add validation results to request for potential use in order creation
    req.stockValidationResults = stockValidationResults;
    next();
  } catch (error) {
    logger.error("Error in stock validation middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during stock validation",
    });
  }
};

/**
 * Middleware to check if a specific menu item has sufficient stock
 */
const validateMenuItemStock = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const { quantity = 1 } = req.body;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: "Menu item ID is required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const availableStock = await inventoryService.getAvailableStock(menuItemId);

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
        data: {
          menuItemId,
          requestedQuantity: quantity,
          availableStock,
        },
      });
    }

    req.availableStock = availableStock;
    next();
  } catch (error) {
    logger.error("Error in menu item stock validation middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during stock validation",
    });
  }
};

/**
 * Middleware to validate stock before adding to cart
 */
const validateCartItemStock = async (req, res, next) => {
  try {
    const { menuItemId, quantity } = req.body;

    if (!menuItemId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Menu item ID and valid quantity are required",
      });
    }

    const availableStock = await inventoryService.getAvailableStock(menuItemId);

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock for this item",
        data: {
          menuItemId,
          requestedQuantity: quantity,
          availableStock,
        },
      });
    }

    req.availableStock = availableStock;
    next();
  } catch (error) {
    logger.error("Error in cart item stock validation middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during stock validation",
    });
  }
};

module.exports = {
  validateStockAvailability,
  validateMenuItemStock,
  validateCartItemStock,
};
