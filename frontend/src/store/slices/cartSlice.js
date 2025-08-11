import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { item, quantity = 1 } = action.payload;
      const existingItem = state.items.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Check if adding more would exceed stock
        if (existingItem.quantity + quantity <= item.stock) {
          existingItem.quantity += quantity;
        } else {
          // If would exceed stock, set to max available
          existingItem.quantity = item.stock;
        }
      } else {
        // Add new item to cart
        const quantityToAdd = Math.min(quantity, item.stock);
        if (quantityToAdd > 0) {
          state.items.push({
            ...item,
            quantity: quantityToAdd,
          });
        }
      }
      
      // Recalculate totals
      state.total = state.items.reduce((sum, cartItem) => 
        sum + (cartItem.price * cartItem.quantity), 0
      );
      state.itemCount = state.items.reduce((sum, cartItem) => 
        sum + cartItem.quantity, 0
      );
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      // Recalculate totals
      state.total = state.items.reduce((sum, cartItem) => 
        sum + (cartItem.price * cartItem.quantity), 0
      );
      state.itemCount = state.items.reduce((sum, cartItem) => 
        sum + cartItem.quantity, 0
      );
    },
    
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const cartItem = state.items.find(item => item.id === itemId);
      
      if (cartItem) {
        // Ensure quantity doesn't exceed stock
        const maxQuantity = cartItem.stock;
        cartItem.quantity = Math.min(Math.max(1, quantity), maxQuantity);
        
        // Recalculate totals
        state.total = state.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        state.itemCount = state.items.reduce((sum, item) => 
          sum + item.quantity, 0
        );
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },
    
    updateStockInCart: (state, action) => {
      const { itemId, newStock } = action.payload;
      const cartItem = state.items.find(item => item.id === itemId);
      
      if (cartItem) {
        cartItem.stock = newStock;
        // If current quantity exceeds new stock, adjust it
        if (cartItem.quantity > newStock) {
          cartItem.quantity = newStock;
        }
        
        // Recalculate totals
        state.total = state.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        state.itemCount = state.items.reduce((sum, item) => 
          sum + item.quantity, 0
        );
      }
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  updateStockInCart 
} = cartSlice.actions;

export default cartSlice.reducer;
