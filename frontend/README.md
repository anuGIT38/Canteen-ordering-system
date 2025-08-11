# Canteen Ordering System - Frontend (Team Member 4)

This is the frontend implementation for Team Member 4 of the Canteen Ordering System with Inventory Locking and Auto-Cancellation.

## 🎯 Team Member 4 Responsibilities

**Focus:** User interface and menu management

**Features Implemented:**
- ✅ Responsive menu display with live stock count
- ✅ Add to cart functionality (disabled when stock is 0)
- ✅ User authentication UI (login/register)
- ✅ Menu item management interface for admins
- ✅ Basic styling and responsive design
- ✅ Redux state management
- ✅ Mock data service for development

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd canteen-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx          # Navigation bar with auth status
│   │   └── Navbar.css
│   ├── menu/
│   │   ├── MenuItem.jsx        # Individual menu item component
│   │   └── MenuItem.css
│   └── admin/
│       ├── AdminMenuItem.jsx   # Admin menu item management
│       ├── AdminMenuItem.css
│       ├── MenuItemForm.jsx    # Add/edit menu item form
│       └── MenuItemForm.css
├── pages/
│   ├── Home.jsx               # Landing page
│   ├── Home.css
│   ├── Menu.jsx               # Menu display page
│   ├── Menu.css
│   ├── Cart.jsx               # Shopping cart page
│   ├── Cart.css
│   ├── auth/
│   │   ├── Login.jsx          # Login page
│   │   ├── Register.jsx       # Registration page
│   │   └── Auth.css
│   └── admin/
│       ├── AdminMenu.jsx      # Admin menu management
│       └── AdminMenu.css
├── store/
│   ├── store.js              # Redux store configuration
│   └── slices/
│       ├── authSlice.js      # Authentication state management
│       ├── menuSlice.js      # Menu items state management
│       └── cartSlice.js      # Shopping cart state management
├── services/
│   └── mockData.js           # Mock data for development
└── App.jsx                   # Main application component
```

## 🔧 Features

### 1. User Authentication
- **Login/Register pages** with form validation
- **JWT token management** with localStorage
- **Protected routes** for authenticated users
- **Admin role detection** for admin-only features

### 2. Menu Display
- **Responsive grid layout** for menu items
- **Live stock count** with visual indicators
- **Category filtering** and search functionality
- **Sort options** (name, price, stock)
- **Stock status indicators** (in-stock, low-stock, out-of-stock)

### 3. Shopping Cart
- **Add to cart** with quantity selection
- **Cart management** (update quantities, remove items)
- **Real-time total calculation**
- **Stock validation** (prevents adding more than available)
- **Cart persistence** across sessions

### 4. Admin Panel
- **Menu item CRUD operations**
- **Stock management** interface
- **Category management**
- **Statistics dashboard**
- **Form validation** and error handling

### 5. Responsive Design
- **Mobile-first approach**
- **Flexible grid layouts**
- **Touch-friendly interactions**
- **Cross-browser compatibility**

## 🎨 Design System

### Color Palette
- **Primary:** `#667eea` to `#764ba2` (Gradient)
- **Success:** `#28a745` to `#20c997` (Gradient)
- **Warning:** `#ffa500`
- **Error:** `#ff4757`
- **Neutral:** `#f5f7fa` to `#c3cfe2` (Background)

### Typography
- **Font Family:** System fonts (San Francisco, Segoe UI, etc.)
- **Font Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Components
- **Cards:** Rounded corners (15px), subtle shadows
- **Buttons:** Gradient backgrounds, hover animations
- **Forms:** Clean inputs with focus states
- **Navigation:** Sticky header with gradient background

## 🔌 Integration Points

### API Endpoints (Ready for Backend Integration)
```javascript
// Authentication
POST /api/auth/login
POST /api/auth/register

// Menu Items
GET /api/menu/items
POST /api/menu/items
PUT /api/menu/items/:id
DELETE /api/menu/items/:id

// Orders (for Team Member 5)
POST /api/orders
GET /api/orders
PUT /api/orders/:id/status
```

### State Management
- **Redux Toolkit** for global state
- **Redux Persist** ready for cart persistence
- **Async thunks** for API calls
- **Optimistic updates** for better UX

## 🧪 Testing

### Mock Data
The application includes comprehensive mock data for development:
- **12 menu items** across different categories
- **Mock users** (regular user and admin)
- **Mock API functions** that simulate real API calls

### Test Credentials
```
Regular User:
- Email: john@example.com
- Password: any password

Admin User:
- Email: admin@example.com
- Password: any password
```

## 🔄 Integration with Other Team Members

### Team Member 1 (Backend Core)
- **Database schema** integration points defined
- **User authentication** system ready
- **CRUD operations** for menu items implemented

### Team Member 2 (Inventory Management)
- **Stock locking** mechanism ready for integration
- **Real-time stock updates** via WebSocket
- **Transaction-safe** stock updates

### Team Member 3 (Order Management)
- **Order creation** flow ready
- **Auto-cancellation** timer integration points
- **Order status** management

### Team Member 5 (Frontend Order System)
- **Checkout flow** ready for integration
- **Real-time updates** via WebSocket
- **Order tracking** interface

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create a `.env` file for production:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## 📱 Browser Support

- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+

## 🤝 Contributing

1. Follow the existing code style
2. Add proper error handling
3. Test on multiple devices
4. Update documentation as needed

## 📄 License

This project is part of the Canteen Ordering System team project.

---

**Team Member 4:** Frontend Core & Menu System  
**Technologies:** React, Vite, Redux Toolkit, CSS3  
**Status:** ✅ Complete and ready for integration
