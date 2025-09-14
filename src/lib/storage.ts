// LocalStorage utilities for POS system data persistence

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  createdAt: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  variants?: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'other';
  amountPaid: number;
  change: number;
  cashierId: string;
  cashierName: string;
  receiptPrinted: boolean;
  timestamp: string;
  date: string;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  severity: 'low' | 'critical';
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'pos_users',
  PRODUCTS: 'pos_products',
  SALES: 'pos_sales',
  SETTINGS: 'pos_settings',
  CURRENT_USER: 'pos_current_user'
} as const;

// Generic storage functions
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// User management
export const userStorage = {
  getAll: (): User[] => storage.get<User[]>(STORAGE_KEYS.USERS) || [],
  
  save: (users: User[]): void => storage.set(STORAGE_KEYS.USERS, users),
  
  add: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = userStorage.getAll();
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    userStorage.save(users);
    return newUser;
  },
  
  update: (id: string, updates: Partial<User>): boolean => {
    const users = userStorage.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    users[index] = { ...users[index], ...updates };
    userStorage.save(users);
    return true;
  },
  
  delete: (id: string): boolean => {
    const users = userStorage.getAll();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    
    userStorage.save(filtered);
    return true;
  },
  
  findByCredentials: (username: string, password: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.username === username && u.password === password && u.isActive) || null;
  }
};

// Product management
export const productStorage = {
  getAll: (): Product[] => storage.get<Product[]>(STORAGE_KEYS.PRODUCTS) || [],
  
  save: (products: Product[]): void => storage.set(STORAGE_KEYS.PRODUCTS, products),
  
  add: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const products = productStorage.getAll();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    products.push(newProduct);
    productStorage.save(products);
    return newProduct;
  },
  
  update: (id: string, updates: Partial<Product>): boolean => {
    const products = productStorage.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    products[index] = { 
      ...products[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    productStorage.save(products);
    return true;
  },
  
  delete: (id: string): boolean => {
    const products = productStorage.getAll();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    
    productStorage.save(filtered);
    return true;
  },
  
  updateStock: (id: string, quantity: number, operation: 'add' | 'subtract' = 'subtract'): boolean => {
    const products = productStorage.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    const currentStock = products[index].stock;
    const newStock = operation === 'add' ? currentStock + quantity : currentStock - quantity;
    
    if (newStock < 0) return false;
    
    products[index].stock = newStock;
    products[index].updatedAt = new Date().toISOString();
    productStorage.save(products);
    return true;
  },
  
  getLowStockAlerts: (): InventoryAlert[] => {
    const products = productStorage.getAll();
    return products
      .filter(p => p.isActive && p.stock <= p.minStock)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        currentStock: p.stock,
        minStock: p.minStock,
        severity: p.stock === 0 ? 'critical' : 'low'
      }));
  },
  
  search: (query: string): Product[] => {
    const products = productStorage.getAll();
    const lowercaseQuery = query.toLowerCase();
    return products.filter(p => 
      p.isActive && (
        p.name.toLowerCase().includes(lowercaseQuery) ||
        p.code.toLowerCase().includes(lowercaseQuery) ||
        p.category.toLowerCase().includes(lowercaseQuery)
      )
    );
  }
};

// Sales management
export const salesStorage = {
  getAll: (): Sale[] => storage.get<Sale[]>(STORAGE_KEYS.SALES) || [],
  
  save: (sales: Sale[]): void => storage.set(STORAGE_KEYS.SALES, sales),
  
  add: (sale: Omit<Sale, 'id' | 'timestamp' | 'date'>): Sale => {
    const sales = salesStorage.getAll();
    const now = new Date();
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0]
    };
    
    // Update product stock
    sale.items.forEach(item => {
      productStorage.updateStock(item.productId, item.quantity);
    });
    
    sales.push(newSale);
    salesStorage.save(sales);
    return newSale;
  },
  
  getByDateRange: (startDate: string, endDate: string): Sale[] => {
    const sales = salesStorage.getAll();
    return sales.filter(s => s.date >= startDate && s.date <= endDate);
  },
  
  getDailySummary: (date: string) => {
    const sales = salesStorage.getAll().filter(s => s.date === date);
    return {
      totalSales: sales.reduce((sum, s) => sum + s.total, 0),
      totalTransactions: sales.length,
      totalItems: sales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
      averageTransaction: sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0
    };
  }
};

// Authentication
export const authStorage = {
  getCurrentUser: (): User | null => storage.get<User>(STORAGE_KEYS.CURRENT_USER),
  
  setCurrentUser: (user: User): void => storage.set(STORAGE_KEYS.CURRENT_USER, user),
  
  logout: (): void => storage.remove(STORAGE_KEYS.CURRENT_USER),
  
  isLoggedIn: (): boolean => authStorage.getCurrentUser() !== null
};

// System settings
export const settingsStorage = {
  get: () => storage.get(STORAGE_KEYS.SETTINGS) || {
    storeName: 'Sari-sari Store',
    storeAddress: '123 Main Street',
    storePhone: '+63 123 456 7890',
    taxRate: 0.12,
    currency: 'PHP'
  },
  
  save: (settings: any) => storage.set(STORAGE_KEYS.SETTINGS, settings)
};

// Data export/import
export const dataManager = {
  exportData: () => {
    const data = {
      users: userStorage.getAll(),
      products: productStorage.getAll(),
      sales: salesStorage.getAll(),
      settings: settingsStorage.get(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  importData: (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.users) userStorage.save(data.users);
          if (data.products) productStorage.save(data.products);
          if (data.sales) salesStorage.save(data.sales);
          if (data.settings) settingsStorage.save(data.settings);
          
          resolve(true);
        } catch (error) {
          console.error('Error importing data:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
};

// Initialize default data
export const initializeDefaultData = () => {
  // Create default admin user if no users exist
  const users = userStorage.getAll();
  if (users.length === 0) {
    userStorage.add({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    
    userStorage.add({
      username: 'cashier',
      password: 'cashier123',
      role: 'cashier',
      isActive: true
    });
  }
  
  // Add sample products if none exist
  const products = productStorage.getAll();
  if (products.length === 0) {
    const sampleProducts = [
      { name: 'Coca Cola 500ml', code: 'COKE500', category: 'Beverages', price: 25, stock: 50, minStock: 10, isActive: true },
      { name: 'Lucky Me Pancit Canton', code: 'LM-PC', category: 'Instant Noodles', price: 15, stock: 100, minStock: 20, isActive: true },
      { name: 'Skyflakes Crackers', code: 'SF-CRACK', category: 'Snacks', price: 12, stock: 30, minStock: 5, isActive: true },
      { name: 'Safeguard Bar Soap', code: 'SG-SOAP', category: 'Personal Care', price: 45, stock: 25, minStock: 5, isActive: true },
      { name: 'C2 Green Tea 500ml', code: 'C2-GT', category: 'Beverages', price: 20, stock: 40, minStock: 10, isActive: true }
    ];
    
    sampleProducts.forEach(product => productStorage.add(product));
  }
};

// Utility function to generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};