require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");

// Import services and utilities
const logger = require("./src/utils/logger");
const websocketService = require("./src/services/websocketService");
const schedulerService = require("./src/services/schedulerService");

// Import routes
const inventoryRoutes = require("./src/routes/inventoryRoutes");

const app = express();
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Inventory Management System is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/inventory", inventoryRoutes);

// WebSocket status endpoint
app.get("/api/websocket/status", (req, res) => {
  res.json({
    success: true,
    data: {
      connectedClients: websocketService.getConnectedClientsCount(),
      activeTasks: schedulerService.getActiveTasks(),
    },
  });
});

// Scheduler control endpoints
app.post("/api/scheduler/cleanup", async (req, res) => {
  try {
    const cleanedCount = await schedulerService.triggerExpiredLockCleanup();
    res.json({
      success: true,
      message: "Manual cleanup triggered successfully",
      data: { cleanedCount },
    });
  } catch (error) {
    logger.error("Error triggering manual cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Error triggering manual cleanup",
    });
  }
});

app.post("/api/scheduler/health-check", async (req, res) => {
  try {
    const stockInfo = await schedulerService.triggerStockHealthCheck();
    res.json({
      success: true,
      message: "Manual health check triggered successfully",
      data: { stockInfo },
    });
  } catch (error) {
    logger.error("Error triggering manual health check:", error);
    res.status(500).json({
      success: false,
      message: "Error triggering manual health check",
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  schedulerService.stopAllTasks();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  schedulerService.stopAllTasks();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Inventory Management Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Initialize scheduler after server starts
  schedulerService.initialize();
});

module.exports = app;
