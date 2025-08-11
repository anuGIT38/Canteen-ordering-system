import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { removeFromCart, updateQuantity, clearCart } from '../store/slices/cartSlice';
import './Cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, itemCount } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity >= 1) {
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    // This will be integrated with Team Member 5's order system
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some delicious items from our menu to get started!</p>
          <button 
            onClick={() => navigate('/menu')}
            className="browse-menu-btn"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <p>{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <span className="food-emoji">{item.emoji || '🍽️'}</span>
              </div>
              
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-description">{item.description}</p>
                <div className="cart-item-category">
                  <span className="category-badge">{item.category}</span>
                </div>
                <div className="cart-item-stock">
                  <span className={`stock-status ${item.stock === 0 ? 'out-of-stock' : item.stock <= 5 ? 'low-stock' : 'in-stock'}`}>
                    {item.stock === 0 ? 'Out of Stock' : item.stock <= 5 ? `Only ${item.stock} left!` : `${item.stock} available`}
                  </span>
                </div>
              </div>
              
              <div className="cart-item-price">
                <span className="price">₹{item.price}</span>
              </div>
              
              <div className="cart-item-quantity">
                <label htmlFor={`quantity-${item.id}`}>Qty:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id={`quantity-${item.id}`}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    min="1"
                    max={item.stock}
                    className="quantity-input"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="cart-item-total">
                <span className="item-total">₹{item.price * item.quantity}</span>
              </div>
              
              <div className="cart-item-actions">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="remove-btn"
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-item">
            <span>Items ({itemCount}):</span>
            <span>₹{total}</span>
          </div>
          
          <div className="summary-item">
            <span>Service Charge:</span>
            <span>₹0</span>
          </div>
          
          <div className="summary-total">
            <span>Total:</span>
            <span>₹{total}</span>
          </div>
          
          <div className="cart-actions">
            <button
              onClick={handleClearCart}
              className="clear-cart-btn"
            >
              Clear Cart
            </button>
            
            <button
              onClick={handleCheckout}
              className="checkout-btn"
              disabled={items.some(item => item.stock === 0)}
            >
              Proceed to Checkout
            </button>
          </div>
          
          <div className="cart-notice">
            <p>
              <strong>Important:</strong> You have 15 minutes to complete your order.
              After that, your cart will be automatically cleared and stock will be restored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
