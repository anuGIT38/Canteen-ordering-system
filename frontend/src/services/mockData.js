// Mock data for development and testing
export const mockMenuItems = [
  {
    id: 1,
    name: "Margherita Pizza",
    description: "Classic tomato sauce with mozzarella cheese and fresh basil",
    price: 299,
    stock: 15,
    category: "Lunch",
    emoji: "🍕",
    imageUrl: "https://images.unsplash.com/photo-1548365328-8b6db7c0ef3c?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Chicken Burger",
    description: "Grilled chicken patty with lettuce, tomato, and special sauce",
    price: 199,
    stock: 8,
    category: "Lunch",
    emoji: "🍔",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Caesar Salad",
    description: "Fresh romaine lettuce with parmesan cheese and caesar dressing",
    price: 149,
    stock: 12,
    category: "Snacks",
    emoji: "🥗",
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Ramen Bowl",
    description: "Traditional Japanese ramen with pork, egg, and vegetables",
    price: 399,
    stock: 5,
    category: "Dinner",
    emoji: "🍜",
    imageUrl: "https://images.unsplash.com/photo-1543352634-8730a9a0b1b2?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 5,
    name: "Sushi Roll",
    description: "Fresh salmon and avocado roll with soy sauce and wasabi",
    price: 249,
    stock: 10,
    category: "Dinner",
    emoji: "🍣",
    imageUrl: "https://images.unsplash.com/photo-1562158070-4bb38e1a4d5a?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 6,
    name: "Club Sandwich",
    description: "Triple-decker sandwich with turkey, bacon, lettuce, and tomato",
    price: 179,
    stock: 7,
    category: "Lunch",
    emoji: "🥪",
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 7,
    name: "Chocolate Cake",
    description: "Rich chocolate cake with chocolate ganache frosting",
    price: 89,
    stock: 20,
    category: "Snacks",
    emoji: "🍰",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476b?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 8,
    name: "Cappuccino",
    description: "Espresso with steamed milk and milk foam",
    price: 79,
    stock: 25,
    category: "Beverages",
    emoji: "☕",
    imageUrl: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 9,
    name: "French Fries",
    description: "Crispy golden fries with sea salt",
    price: 99,
    stock: 0,
    category: "Snacks",
    emoji: "🍟",
    imageUrl: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 10,
    name: "Hot Dog",
    description: "Beef hot dog with mustard, ketchup, and onions",
    price: 129,
    stock: 3,
    category: "Snacks",
    emoji: "🌭",
    imageUrl: "https://images.unsplash.com/photo-1460306855393-0410f61241c7?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 11,
    name: "Scrambled Eggs",
    description: "Fluffy scrambled eggs with butter and herbs",
    price: 119,
    stock: 18,
    category: "Breakfast",
    emoji: "🍳",
    imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 12,
    name: "Pancakes",
    description: "Fluffy pancakes with maple syrup and butter",
    price: 139,
    stock: 14,
    category: "Breakfast",
    emoji: "🥞",
    imageUrl: "https://images.unsplash.com/photo-1495211895960-3d5ad9d0a2d7?q=80&w=1200&auto=format&fit=crop"
  }
];

export const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user"
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin"
  }
];

// Mock API functions for development
export const mockApi = {
  // Menu items
  getMenuItems: () => Promise.resolve(mockMenuItems),
  createMenuItem: (item) => Promise.resolve({ ...item, id: Date.now() }),
  updateMenuItem: (id, item) => Promise.resolve({ ...item, id }),
  deleteMenuItem: (id) => Promise.resolve(id),

  // Auth
  login: (credentials) => {
    const user = mockUsers.find(u => u.email === credentials.email);
    if (user) {
      return Promise.resolve({
        user,
        token: 'mock-jwt-token-' + Date.now()
      });
    }
    return Promise.reject(new Error('Invalid credentials'));
  },
  register: (userData) => {
    const newUser = {
      ...userData,
      id: Date.now(),
      role: 'user'
    };
    return Promise.resolve({
      user: newUser,
      token: 'mock-jwt-token-' + Date.now()
    });
  }
};
