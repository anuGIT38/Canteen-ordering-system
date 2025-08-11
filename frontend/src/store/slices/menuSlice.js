import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for API calls
import { mockApi } from '../../services/mockData';

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (_, { rejectWithValue }) => {
    try {
      // Use mock API for development
      const data = await mockApi.getMenuItems();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch menu items');
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async (menuItem, { rejectWithValue }) => {
    try {
      // Use mock API for development
      const data = await mockApi.createMenuItem(menuItem);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create menu item');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, menuItem }, { rejectWithValue }) => {
    try {
      // Use mock API for development
      const data = await mockApi.updateMenuItem(id, menuItem);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update menu item');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async (id, { rejectWithValue }) => {
    try {
      // Use mock API for development
      await mockApi.deleteMenuItem(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete menu item');
    }
  }
);

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  categories: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages'],
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateStockCount: (state, action) => {
      const { itemId, newStock } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.stock = newStock;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch menu items
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create menu item
      .addCase(createMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update menu item
      .addCase(updateMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete menu item
      .addCase(deleteMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateStockCount } = menuSlice.actions;
export default menuSlice.reducer;
