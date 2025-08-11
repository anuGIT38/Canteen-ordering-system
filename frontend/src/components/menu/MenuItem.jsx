import { useState } from 'react';
import './MenuItem.css';

const MenuItem = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= item.stock) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    if (item.stock > 0) {
      if (showQuantitySelector) {
        onAddToCart(item, quantity);
        setShowQuantitySelector(false);
        setQuantity(1);
      } else {
        setShowQuantitySelector(true);
      }
    }
  };

  const handleQuickAdd = () => {
    if (item.stock > 0) {
      onAddToCart(item, 1);
    }
  };

  const getStockStatus = () => {
    if (item.stock === 0) return 'out-of-stock';
    if (item.stock <= 5) return 'low-stock';
    return 'in-stock';
  };

  const getStockText = () => {
    if (item.stock === 0) return 'Out of Stock';
    if (item.stock <= 5) return `Only ${item.stock} left!`;
    return `${item.stock} available`;
  };

  return (
    <div className={`menu-item ${getStockStatus()}`}>
      <div className="menu-item-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="menu-item-photo" loading="lazy" />
        ) : (
          <span className="food-emoji">
            {item.emoji || '🍽️'}
          </span>
        )}
      </div>
      
      <div className="menu-item-content">
        <div className="menu-item-header">
          <h3 className="menu-item-name">{item.name}</h3>
          <span className="menu-item-price">₹{item.price}</span>
        </div>
        
        <p className="menu-item-description">{item.description}</p>
        
        <div className="menu-item-category">
          <span className="category-badge">{item.category}</span>
        </div>
        
        <div className="menu-item-stock">
          <span className={`stock-status ${getStockStatus()}`}>
            {getStockText()}
          </span>
        </div>
        
        <div className="menu-item-actions">
          {showQuantitySelector ? (
            <div className="quantity-selector">
              <label htmlFor={`quantity-${item.id}`}>Quantity:</label>
              <input
                type="number"
                id={`quantity-${item.id}`}
                min="1"
                max={item.stock}
                value={quantity}
                onChange={handleQuantityChange}
                className="quantity-input"
              />
              <button
                onClick={handleAddToCart}
                className="add-to-cart-btn confirm"
                disabled={item.stock === 0}
              >
                Add {quantity}
              </button>
              <button
                onClick={() => setShowQuantitySelector(false)}
                className="add-to-cart-btn cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button
                onClick={handleAddToCart}
                className="add-to-cart-btn"
                disabled={item.stock === 0}
              >
                {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              {item.stock > 1 && (
                <button
                  onClick={handleQuickAdd}
                  className="quick-add-btn"
                  title="Quick add 1 item"
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
