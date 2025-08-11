const request = require("supertest");
const app = require("../server");

describe("Basic System Tests", () => {
  describe("GET /health", () => {
    it("should return server health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Inventory Management System");
      expect(response.body.timestamp).toBeDefined();
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
});
