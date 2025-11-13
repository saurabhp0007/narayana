// API Configuration
const getBaseURL = () => {
  // Check if we have an explicit environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Check if we're in development
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'http://localhost:3000';
  }

  // Production fallback
  // return 'https://narayana-mszm.onrender.com';
    return 'https://naryana-gpfm9.ondigitalocean.app';  
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  API_PREFIX: '/api',
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },

  // Admin
  ADMIN: {
    BASE: '/admin',
    CREATE: '/admin',
    LIST: '/admin',
    UPDATE: (id: string) => `/admin/${id}`,
    DELETE: (id: string) => `/admin/${id}`,
  },

  // Gender
  GENDER: {
    BASE: '/gender',
    CREATE: '/gender',
    LIST: '/gender',
    GET: (id: string) => `/gender/${id}`,
    UPDATE: (id: string) => `/gender/${id}`,
    DELETE: (id: string) => `/gender/${id}`,
  },

  // Category
  CATEGORY: {
    BASE: '/category',
    CREATE: '/category',
    LIST: '/category',
    GET: (id: string) => `/category/${id}`,
    UPDATE: (id: string) => `/category/${id}`,
    DELETE: (id: string) => `/category/${id}`,
    BY_GENDER: (genderId: string) => `/category/gender/${genderId}`,
  },

  // Subcategory
  SUBCATEGORY: {
    BASE: '/subcategory',
    CREATE: '/subcategory',
    LIST: '/subcategory',
    GET: (id: string) => `/subcategory/${id}`,
    UPDATE: (id: string) => `/subcategory/${id}`,
    DELETE: (id: string) => `/subcategory/${id}`,
    BY_CATEGORY: (categoryId: string) => `/subcategory/category/${categoryId}`,
  },

  // Product
  PRODUCT: {
    BASE: '/product',
    CREATE: '/product',
    LIST: '/product',
    GET: (id: string) => `/product/${id}`,
    UPDATE: (id: string) => `/product/${id}`,
    DELETE: (id: string) => `/product/${id}`,
    SEARCH: '/product/search',
    FEATURED: '/product/featured',
  },

  // Media
  MEDIA: {
    UPLOAD: '/media/upload',
    DELETE: (fileId: string) => `/media/${fileId}`,
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD: '/cart',
    UPDATE: (itemId: string) => `/cart/${itemId}`,
    REMOVE: (itemId: string) => `/cart/${itemId}`,
    CLEAR: '/cart/clear',
  },

  // Wishlist
  WISHLIST: {
    GET: '/wishlist',
    ADD: '/wishlist',
    REMOVE: (itemId: string) => `/wishlist/${itemId}`,
    CLEAR: '/wishlist/clear',
  },

  // Order
  ORDER: {
    BASE: '/order',
    CREATE: '/order',
    LIST: '/order',
    GET: (id: string) => `/order/${id}`,
    UPDATE_STATUS: (id: string) => `/order/${id}/status`,
    USER_ORDERS: '/order/my-orders',
  },

  // Offer
  OFFER: {
    BASE: '/offer',
    CREATE: '/offer',
    LIST: '/offer',
    GET: (id: string) => `/offer/${id}`,
    UPDATE: (id: string) => `/offer/${id}`,
    DELETE: (id: string) => `/offer/${id}`,
    ACTIVE: '/offer/active',
  },
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  CART_ID: '@cart_id',
};
