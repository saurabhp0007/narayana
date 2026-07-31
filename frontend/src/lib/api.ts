import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';


const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't redirect on login/register endpoints - let the page handle the error
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') ||
                             url.includes('/user/login') ||
                             url.includes('/user/register');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  adminLogin: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  userLogin: (data: { email: string; password: string; guestId?: string }) =>
    api.post('/user/login', data),
  userRegister: (data: { name: string; email: string; password: string; phone?: string; guestId?: string }) =>
    api.post('/user/register', data),
  getAdminProfile: () => api.get('/auth/me'),
  getUserProfile: () => api.get('/user/profile'),
  logout: () => api.post('/user/logout'),
};

// Gender API
export const genderApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/gender', { params }),
  getById: (id: string) => api.get(`/gender/${id}`),
  getBySlug: (slug: string) => api.get(`/gender/slug/${slug}`),
  create: (data: { name: string; slug?: string; isActive?: boolean }) =>
    api.post('/gender', data),
  update: (id: string, data: { name?: string; slug?: string; isActive?: boolean }) =>
    api.patch(`/gender/${id}`, data),
  delete: (id: string) => api.delete(`/gender/${id}`),
};

// Category API
export const categoryApi = {
  getAll: (params?: { page?: number; limit?: number; genderId?: string; isActive?: boolean }) =>
    api.get('/category', { params }),
  getById: (id: string) => api.get(`/category/${id}`),
  getBySlug: (slug: string) => api.get(`/category/slug/${slug}`),
  getByGender: (genderId: string) => api.get(`/category/gender/${genderId}`),
  getByTabGroup: (tabGroup: string) => api.get(`/category/tab-group/${tabGroup}`),
  getLatestArrivals: () => api.get('/category/latest-arrivals'),
  getBestSellers: () => api.get('/category/best-sellers'),
  create: (data: { name: string; slug?: string; genderId: string; isActive?: boolean; tabGroup?: string; tileLabel?: string; displayOrder?: number; showInLatestArrivals?: boolean; showInBestSellers?: boolean }) =>
    api.post('/category', data),
  update: (id: string, data: { name?: string; slug?: string; genderId?: string; isActive?: boolean; tabGroup?: string; tileLabel?: string; displayOrder?: number; showInLatestArrivals?: boolean; showInBestSellers?: boolean }) =>
    api.patch(`/category/${id}`, data),
  delete: (id: string) => api.delete(`/category/${id}`),
};

// Product API
export const productApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    genderId?: string;
    genderIds?: string; // Comma-separated list of gender IDs (multi-select)
    categoryId?: string;
    categoryIds?: string; // Comma-separated list of category IDs (multi-select)
    categoryName?: string;
    sizes?: string; // Comma-separated list of sizes (multi-select)
    minPrice?: number;
    maxPrice?: number;
    underPriceAmount?: number;
    inStock?: boolean;
    isActive?: boolean;
    search?: string;
    familySKU?: string;
    productIds?: string; // Comma-separated list of product IDs
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
  }) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySku: (sku: string) => api.get(`/products/sku/${sku}`),
  getRelated: (id: string, limit?: number) => api.get(`/products/${id}/related`, { params: { limit } }),
  getByCategory: (categoryId: string) => api.get(`/products/by-category/${categoryId}`),
  getByHomepageCategory: (categoryId: string) => api.get(`/products/homepage-category/${categoryId}`),
  getByFamily: (familySKU: string) => api.get(`/products/by-family/${familySKU}`),
  getFeatured: (limit?: number) => api.get('/products/featured', { params: { limit } }),
  getBestSellers: (limit?: number) => api.get('/products/best-sellers', { params: { limit } }),
  getLatestArrivals: () => api.get('/products/latest-arrivals'),
  getBestSellersSections: () => api.get('/products/best-sellers-sections'),
  getLowStock: (threshold?: number, limit?: number) => api.get('/products/low-stock', { params: { threshold, limit } }),
  getSizes: (params?: { genderId?: string; categoryId?: string }) => api.get('/products/sizes', { params }),
  autosuggest: (q: string, limit?: number) => api.get('/products/autosuggest', { params: { q, limit } }),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.patch(`/products/${id}`, data),
  updateStock: (id: string, stock: number) => api.patch(`/products/${id}/stock`, { stock }),
  delete: (id: string) => api.delete(`/products/${id}`),
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
  getStats: () => api.get('/orders/stats'),
  create: (data: { notes?: string; shippingAddress?: string; contactEmail?: string; contactPhone?: string }) =>
    api.post('/orders', data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
};

// Offer API
export const offerApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/offers', { params }),
  getActive: () => api.get('/offers/active'),
  getNavbar: () => api.get('/offers/navbar'),
  getHeroBanners: () => api.get('/offers/hero-banners'),
  getById: (id: string) => api.get(`/offers/${id}`),
  getForProduct: (productId: string) => api.get(`/offers/product/${productId}`),
  create: (data: object) => api.post('/offers', data),
  update: (id: string, data: object) => api.patch(`/offers/${id}`, data),
  delete: (id: string) => api.delete(`/offers/${id}`),
};

// Footwear Subcategory API (subcategory tiles inside a homepage Footwear tab group)
export const footwearSubcategoryApi = {
  getAll: (params?: { isActive?: boolean; tabName?: string }) =>
    api.get('/footwear-subcategories', { params }),
  getActive: () => api.get('/footwear-subcategories/active'),
  getBySlug: (slug: string) => api.get(`/footwear-subcategories/slug/${slug}`),
  getById: (id: string) => api.get(`/footwear-subcategories/${id}`),
  create: (data: object) => api.post('/footwear-subcategories', data),
  update: (id: string, data: object) => api.patch(`/footwear-subcategories/${id}`, data),
  delete: (id: string) => api.delete(`/footwear-subcategories/${id}`),
};

// Hero Banner API (independent of Offers)
export const heroBannerApi = {
  getAll: () => api.get('/hero-banners'),
  getActive: () => api.get('/hero-banners/active'),
  getById: (id: string) => api.get(`/hero-banners/${id}`),
  create: (data: object) => api.post('/hero-banners', data),
  update: (id: string, data: object) => api.patch(`/hero-banners/${id}`, data),
  delete: (id: string) => api.delete(`/hero-banners/${id}`),
};

// Collection API (curated homepage product showcase: banner + hand-picked products)
export const collectionApi = {
  getAll: () => api.get('/collections'),
  getActive: () => api.get('/collections/active'),
  getById: (id: string) => api.get(`/collections/${id}`),
  create: (data: object) => api.post('/collections', data),
  update: (id: string, data: object) => api.patch(`/collections/${id}`, data),
  delete: (id: string) => api.delete(`/collections/${id}`),
};

// Shop Category API (homepage "Shop by Category" tabs: independent of each product's own category)
export const shopCategoryApi = {
  getAll: () => api.get('/shop-categories'),
  getActive: () => api.get('/shop-categories/active'),
  getById: (id: string) => api.get(`/shop-categories/${id}`),
  create: (data: object) => api.post('/shop-categories', data),
  update: (id: string, data: object) => api.patch(`/shop-categories/${id}`, data),
  delete: (id: string) => api.delete(`/shop-categories/${id}`),
};

// Shop Subcategory API (subcategory tiles inside a homepage Shop by Category tab)
export const shopSubcategoryApi = {
  getAll: (params?: { isActive?: boolean; shopCategoryId?: string }) =>
    api.get('/shop-subcategories', { params }),
  getActive: () => api.get('/shop-subcategories/active'),
  getBySlug: (slug: string) => api.get(`/shop-subcategories/slug/${slug}`),
  getById: (id: string) => api.get(`/shop-subcategories/${id}`),
  create: (data: object) => api.post('/shop-subcategories', data),
  update: (id: string, data: object) => api.patch(`/shop-subcategories/${id}`, data),
  delete: (id: string) => api.delete(`/shop-subcategories/${id}`),
};

// Settings API
export const settingsApi = {
  getHomepage: () => api.get('/settings/homepage'),
  updateHomepage: (data: {
    countdownEnabled?: boolean;
    countdownEndDate?: string;
    countdownLabel?: string;
    announcementBarEnabled?: boolean;
    announcementBarText?: string;
  }) => api.patch('/settings/homepage', data),
};

// Review API
export const reviewApi = {
  getAll: (params?: { page?: number; limit?: number; isApproved?: boolean }) =>
    api.get('/reviews', { params }),
  getHomepage: (limit?: number) => api.get('/reviews/homepage', { params: { limit } }),
  getSummary: (params?: { productId?: string; categoryId?: string }) =>
    api.get('/reviews/summary', { params }),
  getScoped: (params?: { productId?: string; categoryId?: string; page?: number; limit?: number }) =>
    api.get('/reviews/scoped', { params }),
  getById: (id: string) => api.get(`/reviews/${id}`),
  create: (data: object) => api.post('/reviews', data),
  update: (id: string, data: object) => api.patch(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Media API
export const mediaApi = {
  upload: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { folder },
    });
  },
  uploadMultiple: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/media/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { folder },
    });
  },
  list: () => api.get('/media/list'),
  getDetails: (fileId: string) => api.get(`/media/details/${fileId}`),
  delete: (fileId: string) => api.delete(`/media/${fileId}`),
  deleteMultiple: (fileIds: string[]) => api.delete('/media', { data: { fileIds } }),
};

// Guest API
export const guestApi = {
  generateSession: () => api.post('/guest/session'),
  // Cart
  getCart: (guestId: string) => api.get('/guest/cart', { params: { guestId } }),
  getCartCount: (guestId: string) => api.get('/guest/cart/count', { params: { guestId } }),
  addToCart: (data: { guestId: string; productId: string; quantity?: number }) =>
    api.post('/guest/cart', data),
  updateCartItem: (data: { guestId: string; productId: string; quantity: number }) =>
    api.patch('/guest/cart', data),
  removeFromCart: (guestId: string, productId: string) =>
    api.delete(`/guest/cart/${productId}`, { params: { guestId } }),
  clearCart: (guestId: string) => api.delete('/guest/cart', { params: { guestId } }),
  // Wishlist
  getWishlist: (guestId: string) => api.get('/guest/wishlist', { params: { guestId } }),
  getWishlistCount: (guestId: string) => api.get('/guest/wishlist/count', { params: { guestId } }),
  checkInWishlist: (guestId: string, productId: string) =>
    api.get(`/guest/wishlist/check/${productId}`, { params: { guestId } }),
  addToWishlist: (data: { guestId: string; productId: string }) =>
    api.post('/guest/wishlist', data),
  removeFromWishlist: (guestId: string, productId: string) =>
    api.delete(`/guest/wishlist/${productId}`, { params: { guestId } }),
  clearWishlist: (guestId: string) => api.delete('/guest/wishlist', { params: { guestId } }),
  moveWishlistToCart: (guestId: string, productId: string) =>
    api.post(`/guest/wishlist/move-to-cart/${productId}`, { guestId }),
  // Checkout
  checkout: (data: {
    guestId: string;
    customerDetails: { name: string; email: string; phone: string };
    shippingAddress: { address: string; city: string; state: string; pincode: string };
    notes?: string;
  }) => api.post('/guest/checkout', data),
};
