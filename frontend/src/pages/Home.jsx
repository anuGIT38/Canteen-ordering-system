import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Canteen Ordering System</h1>
          <p className="hero-subtitle">
            Order delicious food online with real-time stock tracking and instant order confirmation.
            Our smart inventory system ensures you never miss out on your favorite dishes.
          </p>
          
          <div className="hero-features">
            <div className="feature">
              <span className="feature-icon">🕒</span>
              <span>15-minute order window</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📱</span>
              <span>Real-time stock updates</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span>Secure inventory locking</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Instant order processing</span>
            </div>
          </div>
          
          <div className="hero-buttons">
            {isAuthenticated ? (
              <Link to="/menu" className="cta-button primary">
                Browse Menu
              </Link>
            ) : (
              <>
                <Link to="/register" className="cta-button primary">
                  Get Started
                </Link>
                <Link to="/login" className="cta-button secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="hero-image">
          <div className="food-grid">
            <div className="food-item">🍕</div>
            <div className="food-item">🍔</div>
            <div className="food-item">🥗</div>
            <div className="food-item">🍜</div>
            <div className="food-item">🍣</div>
            <div className="food-item">🥪</div>
            <div className="food-item">🍰</div>
            <div className="food-item">☕</div>
          </div>
        </div>
      </div>
      
      <div className="info-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Browse Menu</h3>
            <p>Explore our delicious menu with real-time stock availability</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Add to Cart</h3>
            <p>Select your favorite items and add them to your cart</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Place Order</h3>
            <p>Complete your order within 15 minutes to secure your items</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Pick Up</h3>
            <p>Collect your order at the canteen counter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
