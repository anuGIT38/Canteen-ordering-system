import { useState, useEffect } from 'react';
import './MenuItemForm.css';

const MenuItemForm = ({ item, onSubmit, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    emoji: '🍽️',
    imageUrl: '',
  });
  const [errors, setErrors] = useState({});

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        stock: item.stock || '',
        category: item.category || '',
        emoji: item.emoji || '🍽️',
        imageUrl: item.imageUrl || '',
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.imageUrl && !/^https?:\/\//i.test(formData.imageUrl)) {
      newErrors.imageUrl = 'Enter a valid http(s) image URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
      };
      
      if (isEditing) {
        onSubmit(item.id, submitData);
      } else {
        onSubmit(submitData);
      }
    }
  };

  const emojiOptions = [
    '🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🥪', '🍰', '☕', '🥤',
    '🍟', '🌭', '🍖', '🍗', '🥩', '🥓', '🍳', '🥚', '🥞', '🧀',
    '🥨', '🥖', '🥐', '🍞', '🥯', '🥨', '🥖', '🥐', '🍞', '🥯'
  ];

  return (
    <div className="menu-item-form">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
        <button onClick={onCancel} className="close-btn">×</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Item Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="Enter item name"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? 'error' : ''}
            placeholder="Enter item description"
            rows="3"
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price (₹) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={errors.price ? 'error' : ''}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            {errors.price && <span className="error-text">{errors.price}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className={errors.stock ? 'error' : ''}
              placeholder="0"
              min="0"
            />
            {errors.stock && <span className="error-text">{errors.stock}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="emoji">Emoji</label>
            <div className="emoji-selector">
              <input
                type="text"
                id="emoji"
                name="emoji"
                value={formData.emoji}
                onChange={handleChange}
                placeholder="🍽️"
                maxLength="2"
              />
              <div className="emoji-picker">
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                    className="emoji-option"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className={errors.imageUrl ? 'error' : ''}
            placeholder="https://example.com/food.jpg"
          />
          {errors.imageUrl && <span className="error-text">{errors.imageUrl}</span>}
          {formData.imageUrl && (
            <div className="image-preview">
              <img src={formData.imageUrl} alt="Preview" />
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {isEditing ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuItemForm;
