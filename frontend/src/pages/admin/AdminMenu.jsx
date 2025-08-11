import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} from '../../store/slices/menuSlice';
import AdminMenuItem from '../../components/admin/AdminMenuItem';
import MenuItemForm from '../../components/admin/MenuItemForm';
import './AdminMenu.css';

const AdminMenu = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading, error, categories } = useSelector(state => state.menu);
  const { isAuthenticated, isAdmin } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    dispatch(fetchMenuItems());
  }, [dispatch, isAuthenticated, isAdmin, navigate]);

  const handleCreateItem = (menuItem) => {
    dispatch(createMenuItem(menuItem));
    setShowForm(false);
  };

  const handleUpdateItem = (id, menuItem) => {
    dispatch(updateMenuItem({ id, menuItem }));
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      dispatch(deleteMenuItem(id));
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setShowForm(false);
  };

  const filteredItems = items.filter(item => 
    selectedCategory === 'All' || item.category === selectedCategory
  );

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading menu items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Menu Management</h1>
        <p>Manage your canteen menu items, stock levels, and pricing</p>
      </div>

      <div className="admin-controls">
        <div className="admin-actions">
          <button
            onClick={() => setShowForm(true)}
            className="add-item-btn"
          >
            + Add New Item
          </button>
          
          <div className="category-filter">
            <label>Filter by Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <MenuItemForm
              item={editingItem}
              onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
              onCancel={handleCancelEdit}
              categories={categories}
            />
          </div>
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Items</h3>
          <span className="stat-number">{items.length}</span>
        </div>
        <div className="stat-card">
          <h3>Out of Stock</h3>
          <span className="stat-number">{items.filter(item => item.stock === 0).length}</span>
        </div>
        <div className="stat-card">
          <h3>Low Stock</h3>
          <span className="stat-number">{items.filter(item => item.stock > 0 && item.stock <= 5).length}</span>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <span className="stat-number">{categories.length}</span>
        </div>
      </div>

      <div className="admin-menu-grid">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <p>No items found in the selected category.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <AdminMenuItem
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          ))
        )}
      </div>

      <div className="admin-footer">
        <p>
          <strong>Note:</strong> Changes to menu items will be reflected immediately.
          Stock updates are synchronized with the ordering system.
        </p>
      </div>
    </div>
  );
};

export default AdminMenu;
