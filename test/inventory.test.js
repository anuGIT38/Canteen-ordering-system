const request = require("supertest");
const app = require("../server");
const db = require("../src/config/database");

describe("Inventory Management System", () => {
  let testMenuItemId;
  let testOrderId;

  beforeAll(async () => {
    // Create a test menu item using placeholder database
    const menuItem = await db.menuItem().create({
      data: {
        name: "Test Burger",
        description: "Test burger for testing",
        price: 10.99,
        category: "Test",
        stockCount: 20,
        isAvailable: true,
      },
    });
    testMenuItemId = menuItem ? menuItem.id : "test-menu-item-id";
  });

  afterAll(async () => {
    // Clean up test data using placeholder database
    if (testOrderId) {
      await db.stockLock().deleteMany({
        where: { orderId: testOrderId },
      });
      await db.orderItem().deleteMany({
        where: { orderId: testOrderId },
      });
      await db.order().deleteMany({
        where: { id: testOrderId },
      });
    }
    if (testMenuItemId) {
      await db.menuItem().deleteMany({
        where: { id: testMenuItemId },
      });
    }
    await db.disconnect();
  });

  describe("GET /health", () => {
    it("should return server health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Inventory Management System");
    });
  });

  describe("GET /api/inventory/stock", () => {
    it("should return real-time stock information", async () => {
      const response = await request(app)
        .get("/api/inventory/stock")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("GET /api/inventory/stock/:menuItemId", () => {
    it("should return stock information for specific menu item", async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${testMenuItemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.menuItemId).toBe(testMenuItemId);
      expect(response.body.data.availableStock).toBeDefined();
      expect(response.body.data.lockedStock).toBeDefined();
    });

    it("should return 500 for non-existent menu item", async () => {
      const response = await request(app)
        .get("/api/inventory/stock/non-existent-id")
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/inventory/lock", () => {
    it("should lock stock for an order", async () => {
      // Create a test order first using placeholder database
      const testUser = await db.user().findFirst();
      const order = await db.order().create({
        data: {
          userId: testUser ? testUser.id : "test-user-id",
          status: "PENDING",
          totalAmount: 21.98,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      testOrderId = order ? order.id : "test-order-id";

      const response = await request(app)
        .post("/api/inventory/lock")
        .send({
          orderId: testOrderId,
          items: [
            {
              menuItemId: testMenuItemId,
              quantity: 2,
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Stock locked successfully");
      expect(response.body.data.orderId).toBe(testOrderId);
      expect(response.body.data.lockedItems).toHaveLength(1);
    });

    it("should fail to lock stock when insufficient quantity", async () => {
      const response = await request(app)
        .post("/api/inventory/lock")
        .send({
          orderId: "test-order-id",
          items: [
            {
              menuItemId: testMenuItemId,
              quantity: 100, // More than available stock
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Insufficient stock");
    });
  });

  describe("POST /api/inventory/release", () => {
    it("should release stock lock for an order", async () => {
      const response = await request(app)
        .post("/api/inventory/release")
        .send({
          orderId: testOrderId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Stock lock released successfully"
      );
      expect(response.body.data.orderId).toBe(testOrderId);
    });
  });

  describe("PUT /api/inventory/stock/:menuItemId", () => {
    it("should update stock count for a menu item", async () => {
      const response = await request(app)
        .put(`/api/inventory/stock/${testMenuItemId}`)
        .send({
          newStockCount: 25,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Stock count updated successfully"
      );
      expect(response.body.data.stockCount).toBe(25);
    });

    it("should fail with negative stock count", async () => {
      const response = await request(app)
        .put(`/api/inventory/stock/${testMenuItemId}`)
        .send({
          newStockCount: -5,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/websocket/status", () => {
    it("should return WebSocket status", async () => {
      const response = await request(app)
        .get("/api/websocket/status")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.connectedClients).toBeDefined();
      expect(response.body.data.activeTasks).toBeDefined();
    });
  });

  describe("POST /api/scheduler/cleanup", () => {
    it("should trigger manual cleanup", async () => {
      const response = await request(app)
        .post("/api/scheduler/cleanup")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Manual cleanup triggered successfully"
      );
      expect(response.body.data.cleanedCount).toBeDefined();
    });
  });

  describe("POST /api/scheduler/health-check", () => {
    it("should trigger manual health check", async () => {
      const response = await request(app)
        .post("/api/scheduler/health-check")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Manual health check triggered successfully"
      );
      expect(response.body.data.stockInfo).toBeDefined();
    });
  });
});
