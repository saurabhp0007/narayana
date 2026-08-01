import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://narayana-69sw.vercel.app/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials on unauthorized
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  userLogin: (data: { email: string; password: string }) =>
    api.post('/user/login', data),
  userRegister: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/user/register', data),
  getUserProfile: () => api.get('/user/profile'),
  logout: () => api.post('/user/logout'),
};

// Gender API
export const genderApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/gender', { params }),
  getById: (id: string) => api.get(`/gender/${id}`),
  getBySlug: (slug: string) => api.get(`/gender/slug/${slug}`),
};

// Category API
export const categoryApi = {
  getAll: (params?: { page?: number; limit?: number; genderId?: string; isActive?: boolean }) =>
    api.get('/category', { params }),
  getById: (id: string) => api.get(`/category/${id}`),
  getBySlug: (slug: string) => api.get(`/category/slug/${slug}`),
  getByGender: (genderId: string) => api.get(`/category/gender/${genderId}`),
};

// Subcategory API
export const subcategoryApi = {
  getAll: (params?: { page?: number; limit?: number; categoryId?: string; isActive?: boolean }) =>
    api.get('/subcategory', { params }),
  getById: (id: string) => api.get(`/subcategory/${id}`),
  getBySlug: (slug: string) => api.get(`/subcategory/slug/${slug}`),
  getByCategory: (categoryId: string) => api.get(`/subcategory/category/${categoryId}`),
};

// Product API
export const productApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    genderId?: string;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    underPriceAmount?: number;
    inStock?: boolean;
    isActive?: boolean;
    search?: string;
    familySKU?: string;
    productIds?: string; // Comma-separated list of product IDs
  }) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySku: (sku: string) => api.get(`/products/sku/${sku}`),
  getByCategory: (categoryId: string) => api.get(`/products/by-category/${categoryId}`),
  getBySubcategory: (subcategoryId: string) => api.get(`/products/by-subcategory/${subcategoryId}`),
  getByFamily: (familySKU: string) => api.get(`/products/by-family/${familySKU}`),
  getFeatured: (limit?: number) => api.get('/products/featured', { params: { limit } }),
  getLatestArrivals: () => api.get('/products/latest-arrivals'),
  getBestSellersSections: () => api.get('/products/best-sellers-sections'),
  autosuggest: (q: string, limit?: number) => api.get('/products/autosuggest', { params: { q, limit } }),
};

// Cart API
export const cartApi = {
  get: () => api.get('/cart'),
  getCount: () => api.get('/cart/count'),
  add: (data: { productId: string; quantity?: number }) => api.post('/cart', data),
  update: (id: string, quantity: number) => api.patch(`/cart/${id}`, { quantity }),
  remove: (id: string) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

// Wishlist API
export const wishlistApi = {
  get: () => api.get('/wishlist'),
  getCount: () => api.get('/wishlist/count'),
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
  add: (productId: string) => api.post('/wishlist', { productId }),
  remove: (id: string) => api.delete(`/wishlist/${id}`),
  clear: () => api.delete('/wishlist'),
};

// Order API
export const orderApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; fromDate?: string; toDate?: string }) =>
    api.get('/orders', { params }),
  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders/my-orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  getByOrderId: (orderId: string) => api.get(`/orders/order-id/${orderId}`),
  create: (data: { notes?: string; shippingAddress?: string; contactEmail?: string; contactPhone?: string }) =>
    api.post('/orders', data),
};

// Offer API
export const offerApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/offers', { params }),
  getActive: () => api.get('/offers/active'),
  getHomepage: () => api.get('/offers/homepage'),
  getNavbar: () => api.get('/offers/navbar'),
  getById: (id: string) => api.get(`/offers/${id}`),
  getForProduct: (productId: string) => api.get(`/offers/product/${productId}`),
};

// Footwear Subcategory API (subcategory tiles inside a homepage Footwear tab group)
export const footwearSubcategoryApi = {
  getAll: (params?: { isActive?: boolean; tabName?: string }) => api.get('/footwear-subcategories', { params }),
  getActive: () => api.get('/footwear-subcategories/active'),
  getBySlug: (slug: string) => api.get(`/footwear-subcategories/slug/${slug}`),
};

// Hero Banner API (independent of Offers)
export const heroBannerApi = {
  getAll: () => api.get('/hero-banners'),
  getActive: () => api.get('/hero-banners/active'),
};

// Collection API (curated homepage product showcase: banner + hand-picked products)
export const collectionApi = {
  getAll: () => api.get('/collections'),
  getActive: () => api.get('/collections/active'),
};

// Shop Category API (homepage "Shop by Category" tabs)
export const shopCategoryApi = {
  getAll: () => api.get('/shop-categories'),
  getActive: () => api.get('/shop-categories/active'),
};

// Shop Subcategory API (subcategory tiles inside a homepage Shop by Category tab)
export const shopSubcategoryApi = {
  getAll: (params?: { isActive?: boolean; shopCategoryId?: string }) => api.get('/shop-subcategories', { params }),
  getActive: () => api.get('/shop-subcategories/active'),
};

// Settings API
export const settingsApi = {
  getHomepage: () => api.get('/settings/homepage'),
};

// Review API
export const reviewApi = {
  getHomepage: (limit?: number) => api.get('/reviews/homepage', { params: { limit } }),
};

