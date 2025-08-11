const db = require('../connection');

class OrderModel {
  // Create new order with items
  static async create(orderData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const { userId, items, totalAmount, specialInstructions } = orderData;
      
      // Create order
      const orderQuery = `
        INSERT INTO orders (user_id, total_amount, special_instructions, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [userId, totalAmount, specialInstructions]);
      const order = orderResult.rows[0];
      
      // Create order items
      for (const item of items) {
        const orderItemQuery = `
          INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(orderItemQuery, [
          order.id, 
          item.menuItemId, 
          item.quantity, 
          item.unitPrice, 
          item.totalPrice
        ]);
      }
      
      await client.query('COMMIT');
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get order by ID with items
  static async findById(id) {
    const orderQuery = `
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    
    const orderResult = await db.query(orderQuery, [id]);
    if (orderResult.rows.length === 0) return null;
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT oi.*, mi.name, mi.description, mi.image_url
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `;
    
    const itemsResult = await db.query(itemsQuery, [id]);
    order.items = itemsResult.rows;
    
    return order;
  }

  // Get user's orders
  static async findByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT o.id, o.status, o.total_amount, o.created_at, o.estimated_completion_time
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  // Get all orders (for admin)
  static async findAll(limit = 50, offset = 0, status = null) {
    let query = `
      SELECT o.id, o.status, o.total_amount, o.created_at, o.estimated_completion_time,
             u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    const values = [];
    let paramCount = 1;
    
    if (status) {
      query += ` WHERE o.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await db.query(query, values);
    return result.rows;
  }

  // Update order status
  static async updateStatus(id, status, estimatedCompletionTime = null) {
    let query = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const values = [status];
    
    if (estimatedCompletionTime) {
      query += ', estimated_completion_time = $2';
      values.push(estimatedCompletionTime);
    }
    
    query += ' WHERE id = $' + (values.length + 1) + ' RETURNING *';
    values.push(id);
    
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  // Cancel order
  static async cancel(id, reason = 'Cancelled by user') {
    const query = `
      UPDATE orders 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status IN ('pending', 'confirmed')
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get expired orders (for auto-cancellation)
  static async getExpiredOrders() {
    const query = `
      SELECT id, user_id, total_amount
      FROM orders 
      WHERE status = 'pending' AND expires_at < NOW()
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Auto-cancel expired orders
  static async autoCancelExpired() {
    const query = `
      UPDATE orders 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING id, user_id, total_amount
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Get order statistics
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }

  // Get orders by status
  static async getByStatus(status, limit = 50) {
    const query = `
      SELECT o.id, o.total_amount, o.created_at, o.estimated_completion_time,
             u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = $1
      ORDER BY o.created_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [status, limit]);
    return result.rows;
  }
}

module.exports = OrderModel;
