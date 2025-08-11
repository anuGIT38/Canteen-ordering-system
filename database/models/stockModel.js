const db = require('../connection');

class StockModel {
  // Lock stock for an order (reserve items)
  static async lockStock(orderId, items) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const lockedItems = [];
      
      for (const item of items) {
        // Check current stock
        const stockQuery = 'SELECT stock_quantity FROM menu_items WHERE id = $1 FOR UPDATE';
        const stockResult = await client.query(stockQuery, [item.menuItemId]);
        
        if (stockResult.rows.length === 0) {
          throw new Error(`Menu item ${item.menuItemId} not found`);
        }
        
        const currentStock = stockResult.rows[0].stock_quantity;
        
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for item ${item.menuItemId}. Available: ${currentStock}, Requested: ${item.quantity}`);
        }
        
        // Lock stock (reduce available stock)
        const lockQuery = `
          UPDATE menu_items 
          SET stock_quantity = stock_quantity - $1
          WHERE id = $2
          RETURNING id, stock_quantity
        `;
        
        const lockResult = await client.query(lockQuery, [item.quantity, item.menuItemId]);
        const newStock = lockResult.rows[0].stock_quantity;
        
        // Record stock transaction
        const transactionQuery = `
          INSERT INTO stock_transactions 
          (menu_item_id, order_id, transaction_type, quantity, previous_stock, new_stock)
          VALUES ($1, $2, 'lock', $3, $4, $5)
        `;
        
        await client.query(transactionQuery, [
          item.menuItemId, 
          orderId, 
          item.quantity, 
          currentStock, 
          newStock
        ]);
        
        lockedItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          previousStock: currentStock,
          newStock: newStock
        });
      }
      
      await client.query('COMMIT');
      return lockedItems;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Unlock stock when order is cancelled
  static async unlockStock(orderId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get order items
      const itemsQuery = `
        SELECT oi.menu_item_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = $1
      `;
      
      const itemsResult = await client.query(itemsQuery, [orderId]);
      
      if (itemsResult.rows.length === 0) {
        await client.query('COMMIT');
        return [];
      }
      
      const unlockedItems = [];
      
      for (const item of itemsResult.rows) {
        // Get current stock
        const stockQuery = 'SELECT stock_quantity FROM menu_items WHERE id = $1 FOR UPDATE';
        const stockResult = await client.query(stockQuery, [item.menu_item_id]);
        
        if (stockResult.rows.length === 0) continue;
        
        const currentStock = stockResult.rows[0].stock_quantity;
        const newStock = currentStock + item.quantity;
        
        // Restore stock
        const unlockQuery = `
          UPDATE menu_items 
          SET stock_quantity = $1
          WHERE id = $2
          RETURNING id, stock_quantity
        `;
        
        await client.query(unlockQuery, [newStock, item.menu_item_id]);
        
        // Record stock transaction
        const transactionQuery = `
          INSERT INTO stock_transactions 
          (menu_item_id, order_id, transaction_type, quantity, previous_stock, new_stock)
          VALUES ($1, $2, 'unlock', $3, $4, $5)
        `;
        
        await client.query(transactionQuery, [
          item.menu_item_id, 
          orderId, 
          item.quantity, 
          currentStock, 
          newStock
        ]);
        
        unlockedItems.push({
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
          previousStock: currentStock,
          newStock: newStock
        });
      }
      
      await client.query('COMMIT');
      return unlockedItems;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Deduct stock when order is completed
  static async deductStock(orderId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get order items
      const itemsQuery = `
        SELECT oi.menu_item_id, oi.quantity
        FROM order_items oi
        WHERE oi.order_id = $1
      `;
      
      const itemsResult = await client.query(itemsQuery, [orderId]);
      
      if (itemsResult.rows.length === 0) {
        await client.query('COMMIT');
        return [];
      }
      
      const deductedItems = [];
      
      for (const item of itemsResult.rows) {
        // Get current stock
        const stockQuery = 'SELECT stock_quantity FROM menu_items WHERE id = $1 FOR UPDATE';
        const stockResult = await client.query(stockQuery, [item.menu_item_id]);
        
        if (stockResult.rows.length === 0) continue;
        
        const currentStock = stockResult.rows[0].stock_quantity;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        // Update stock (already locked, so just record the deduction)
        const updateQuery = `
          UPDATE menu_items 
          SET stock_quantity = $1
          WHERE id = $2
          RETURNING id, stock_quantity
        `;
        
        await client.query(updateQuery, [newStock, item.menu_item_id]);
        
        // Record stock transaction
        const transactionQuery = `
          INSERT INTO stock_transactions 
          (menu_item_id, order_id, transaction_type, quantity, previous_stock, new_stock)
          VALUES ($1, $2, 'deduct', $3, $4, $5)
        `;
        
        await client.query(transactionQuery, [
          item.menu_item_id, 
          orderId, 
          item.quantity, 
          currentStock, 
          newStock
        ]);
        
        deductedItems.push({
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
          previousStock: currentStock,
          newStock: newStock
        });
      }
      
      await client.query('COMMIT');
      return deductedItems;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get current stock levels
  static async getStockLevels() {
    const query = `
      SELECT 
        mi.id, mi.name, mi.stock_quantity, mi.is_available,
        mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mc.name, mi.name
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Get low stock items (below threshold)
  static async getLowStockItems(threshold = 5) {
    const query = `
      SELECT 
        mi.id, mi.name, mi.stock_quantity, mi.is_available,
        mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.stock_quantity <= $1 AND mi.is_available = true
      ORDER BY mi.stock_quantity ASC
    `;
    
    const result = await db.query(query, [threshold]);
    return result.rows;
  }

  // Get stock transactions for audit
  static async getTransactions(limit = 100, offset = 0) {
    const query = `
      SELECT 
        st.*, mi.name as item_name, o.id as order_id
      FROM stock_transactions st
      JOIN menu_items mi ON st.menu_item_id = mi.id
      LEFT JOIN orders o ON st.order_id = o.id
      ORDER BY st.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  // Update stock manually (for admin)
  static async updateStock(itemId, newQuantity, reason = 'Manual update') {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get current stock
      const currentQuery = 'SELECT stock_quantity FROM menu_items WHERE id = $1 FOR UPDATE';
      const currentResult = await client.query(currentQuery, [itemId]);
      
      if (currentResult.rows.length === 0) {
        throw new Error('Menu item not found');
      }
      
      const currentStock = currentResult.rows[0].stock_quantity;
      
      // Update stock
      const updateQuery = `
        UPDATE menu_items 
        SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, stock_quantity
      `;
      
      await client.query(updateQuery, [newQuantity, itemId]);
      
      // Record transaction
      const transactionQuery = `
        INSERT INTO stock_transactions 
        (menu_item_id, transaction_type, quantity, previous_stock, new_stock)
        VALUES ($1, 'restore', $2, $3, $4)
      `;
      
      await client.query(transactionQuery, [
        itemId, 
        Math.abs(newQuantity - currentStock), 
        currentStock, 
        newQuantity
      ]);
      
      await client.query('COMMIT');
      
      return {
        itemId,
        previousStock: currentStock,
        newStock: newQuantity,
        change: newQuantity - currentStock
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get stock alerts
  static async getStockAlerts() {
    const query = `
      SELECT 
        mi.id, mi.name, mi.stock_quantity, mi.is_available,
        mc.name as category_name,
        CASE 
          WHEN mi.stock_quantity = 0 THEN 'Out of stock'
          WHEN mi.stock_quantity <= 3 THEN 'Critical'
          WHEN mi.stock_quantity <= 10 THEN 'Low'
          ELSE 'Normal'
        END as alert_level
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.stock_quantity <= 10 AND mi.is_available = true
      ORDER BY mi.stock_quantity ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = StockModel;
