const { Server } = require("socket.io");
const logger = require("../utils/logger");

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.setupEventHandlers();
    logger.info("WebSocket server initialized");
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Store client information
      this.connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        rooms: new Set(),
      });

      // Handle client joining specific rooms
      socket.on("join-room", (room) => {
        socket.join(room);
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.add(room);
        }
        logger.info(`Client ${socket.id} joined room: ${room}`);
      });

      // Handle client leaving rooms
      socket.on("leave-room", (room) => {
        socket.leave(room);
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.rooms.delete(room);
        }
        logger.info(`Client ${socket.id} left room: ${room}`);
      });

      // Handle client disconnection
      socket.on("disconnect", () => {
        this.connectedClients.delete(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle stock update requests
      socket.on("request-stock-update", (menuItemId) => {
        logger.info(`Stock update requested for menu item: ${menuItemId}`);
        // This will be handled by the inventory service
      });

      // Handle order status updates
      socket.on("request-order-update", (orderId) => {
        logger.info(`Order update requested for order: ${orderId}`);
        // This will be handled by the order service
      });
    });
  }

  /**
   * Broadcast stock update to all connected clients
   * @param {Object} stockData - Stock update data
   */
  broadcastStockUpdate(stockData) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.emit("stock-update", {
      type: "stock-update",
      data: stockData,
      timestamp: new Date().toISOString(),
    });

    logger.info("Stock update broadcasted to all clients");
  }

  /**
   * Send stock update to specific room (e.g., admin dashboard)
   * @param {string} room - Room name
   * @param {Object} stockData - Stock update data
   */
  sendStockUpdateToRoom(room, stockData) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.to(room).emit("stock-update", {
      type: "stock-update",
      data: stockData,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Stock update sent to room: ${room}`);
  }

  /**
   * Send order status update to specific client
   * @param {string} orderId - Order ID
   * @param {Object} orderData - Order update data
   */
  sendOrderUpdate(orderId, orderData) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.emit("order-update", {
      type: "order-update",
      orderId,
      data: orderData,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Order update sent for order: ${orderId}`);
  }

  /**
   * Send notification to specific client
   * @param {string} clientId - Client socket ID
   * @param {Object} notification - Notification data
   */
  sendNotification(clientId, notification) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.to(clientId).emit("notification", {
      type: "notification",
      data: notification,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Notification sent to client: ${clientId}`);
  }

  /**
   * Broadcast system notification to all clients
   * @param {Object} notification - Notification data
   */
  broadcastNotification(notification) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.emit("system-notification", {
      type: "system-notification",
      data: notification,
      timestamp: new Date().toISOString(),
    });

    logger.info("System notification broadcasted to all clients");
  }

  /**
   * Send stock lock notification
   * @param {Object} lockData - Stock lock data
   */
  sendStockLockNotification(lockData) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.emit("stock-lock", {
      type: "stock-lock",
      data: lockData,
      timestamp: new Date().toISOString(),
    });

    logger.info("Stock lock notification sent");
  }

  /**
   * Send stock release notification
   * @param {Object} releaseData - Stock release data
   */
  sendStockReleaseNotification(releaseData) {
    if (!this.io) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    this.io.emit("stock-release", {
      type: "stock-release",
      data: releaseData,
      timestamp: new Date().toISOString(),
    });

    logger.info("Stock release notification sent");
  }

  /**
   * Get connected clients count
   * @returns {number} Number of connected clients
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients information
   * @returns {Array} Array of connected clients
   */
  getConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Check if a client is connected
   * @param {string} clientId - Client socket ID
   * @returns {boolean} Connection status
   */
  isClientConnected(clientId) {
    return this.connectedClients.has(clientId);
  }
}

module.exports = new WebSocketService();
