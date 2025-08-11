import './AdminMenuItem.css';

const AdminMenuItem = ({ item, onEdit, onDelete }) => {
  const getStockStatus = () => {
    if (item.stock === 0) return 'out-of-stock';
    if (item.stock <= 5) return 'low-stock';
    return 'in-stock';
  };

  const getStockText = () => {
    if (item.stock === 0) return 'Out of Stock';
    if (item.stock <= 5) return `Low Stock (${item.stock})`;
    return `In Stock (${item.stock})`;
  };

  return (
    <div className={`admin-menu-item ${getStockStatus()}`}>
      <div className="admin-item-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="admin-item-photo" loading="lazy" />
        ) : (
          <span className="food-emoji">{item.emoji || '🍽️'}</span>
        )}
      </div>
      
      <div className="admin-item-content">
        <div className="admin-item-header">
          <h3 className="admin-item-name">{item.name}</h3>
          <span className="admin-item-price">₹{item.price}</span>
        </div>
        
        <p className="admin-item-description">{item.description}</p>
        
        <div className="admin-item-details">
          <div className="detail-row">
            <span className="detail-label">Category:</span>
            <span className="detail-value">{item.category}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Stock:</span>
            <span className={`detail-value stock-status ${getStockStatus()}`}>
              {getStockText()}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{item.id}</span>
          </div>
        </div>
      </div>
      
      <div className="admin-item-actions">
        <button
          onClick={() => onEdit(item)}
          className="edit-btn"
          title="Edit item"
        >
          ✏️ Edit
        </button>
        
        <button
          onClick={() => onDelete(item.id)}
          className="delete-btn"
          title="Delete item"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default AdminMenuItem;
