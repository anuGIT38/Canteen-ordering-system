import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMenuItems } from '../store/slices/menuSlice';
import { addToCart } from '../store/slices/cartSlice';
import MenuItem from '../components/menu/MenuItem';
import './Menu.css';

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading, error, categories } = useSelector(state => state.menu);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleAddToCart = (item, quantity = 1) => {
    if (item.stock > 0) {
      dispatch(addToCart({ item, quantity }));
    }
  };

  const filteredItems = items
    .filter(item => 
      selectedCategory === 'All' || item.category === selectedCategory
    )
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="menu-container">
        <div className="loading">Loading menu items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Our Menu</h1>
        <p>Explore our delicious offerings with real-time stock availability</p>
      </div>

      <div className="menu-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <div className="category-filter">
            <label>Category:</label>
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

          <div className="sort-filter">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="menu-grid">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <p>No items found matching your criteria.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>

      <div className="menu-footer">
        <p>
          <strong>Note:</strong> Orders are automatically cancelled if not completed within 15 minutes.
          Stock is locked when items are added to cart.
        </p>
      </div>
    </div>
  );
};

export default Menu;
