const db = require('../connection');

class UserModel {
  // Create new user
  static async create(userData) {
    const { email, passwordHash, firstName, lastName, phone, role = 'customer' } = userData;
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, phone, created_at
    `;
    
    const values = [email, passwordHash, firstName, lastName, phone, role];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, role, phone, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update user
  static async update(id, updateData) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'role'];
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
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, phone, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get all users (for admin)
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT id, email, first_name, last_name, role, phone, created_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  // Get user count
  static async count() {
    const query = 'SELECT COUNT(*) FROM users';
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = UserModel;
