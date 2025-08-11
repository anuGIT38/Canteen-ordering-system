const db = require('../connection');

class MenuModel {
  // Get all menu items with category info
  static async findAll() {
    const query = `
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.stock_quantity,
        mi.is_available, mi.image_url, mi.preparation_time,
        mc.name as category_name, mc.description as category_description
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.is_available = true
      ORDER BY mc.name, mi.name
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Get menu items by category
  static async findByCategory(categoryId) {
    const query = `
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.stock_quantity,
        mi.is_available, mi.image_url, mi.preparation_time
      FROM menu_items mi
      WHERE mi.category_id = $1 AND mi.is_available = true
      ORDER BY mi.name
    `;
    
    const result = await db.query(query, [categoryId]);
    return result.rows;
  }

  // Get single menu item
  static async findById(id) {
    const query = `
      SELECT 
        mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Create new menu item
  static async create(menuData) {
    const { categoryId, name, description, price, stockQuantity, preparationTime, imageUrl } = menuData;
    
    const query = `
      INSERT INTO menu_items (category_id, name, description, price, stock_quantity, preparation_time, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [categoryId, name, description, price, stockQuantity, preparationTime, imageUrl];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Update menu item
  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'price', 'stock_quantity', 'preparation_time', 'image_url', 'is_available'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE menu_items 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  // Delete menu item
  static async delete(id) {
    const query = 'DELETE FROM menu_items WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get all categories
  static async getCategories() {
    const query = 'SELECT * FROM menu_categories WHERE is_active = true ORDER BY name';
    const result = await db.query(query);
    return result.rows;
  }

  // Create category
  static async createCategory(categoryData) {
    const { name, description } = categoryData;
    
    const query = `
      INSERT INTO menu_categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description]);
    return result.rows[0];
  }

  // Update category
  static async updateCategory(id, updateData) {
    const allowedFields = ['name', 'description', 'is_active'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE menu_categories 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  // Get available items (in stock)
  static async getAvailableItems() {
    const query = `
      SELECT id, name, price, stock_quantity, preparation_time
      FROM menu_items 
      WHERE is_available = true AND stock_quantity > 0
      ORDER BY name
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Check stock availability
  static async checkStock(itemId, quantity) {
    const query = 'SELECT stock_quantity, is_available FROM menu_items WHERE id = $1';
    const result = await db.query(query, [itemId]);
    
    if (result.rows.length === 0) return { available: false, message: 'Item not found' };
    
    const item = result.rows[0];
    if (!item.is_available) return { available: false, message: 'Item not available' };
    if (item.stock_quantity < quantity) return { available: false, message: 'Insufficient stock' };
    
    return { available: true, currentStock: item.stock_quantity };
  }
}

module.exports = MenuModel;
