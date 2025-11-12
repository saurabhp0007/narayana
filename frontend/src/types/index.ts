// Base types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: Admin;
}

export interface Admin {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Gender types
export interface Gender {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenderDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  gender: Gender | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  gender: string;
  isActive?: boolean;
}

// Subcategory types
export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: Category | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcategoryDto {
  name: string;
  description?: string;
  category: string;
  isActive?: boolean;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  familySKU?: string;
  gender: Gender | string;
  category: Category | string;
  subcategory: Subcategory | string;
  price: number;
  discountedPrice?: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  videos?: string[];
  attributes: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  familySKU?: string;
  gender: string;
  category: string;
  subcategory: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  images?: string[];
  videos?: string[];
  attributes?: Record<string, any>;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductFilters {
  gender?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  isFeatured?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Cart types
export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface AddToCartDto {
  productId: string;
  quantity: number;
}

// Wishlist types
export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: string;
}

export interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
}

// Order types
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  product: Product | string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  _id: string;
  orderId: string;
  user: {
    email: string;
    name: string;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  user: {
    email: string;
    name: string;
  };
  shippingAddress: ShippingAddress;
}

// Offer types
export enum OfferType {
  BUY_X_GET_Y = 'buyXgetY',
  BUNDLE_DISCOUNT = 'bundleDiscount',
  PERCENTAGE_OFF = 'percentageOff',
  FIXED_AMOUNT_OFF = 'fixedAmountOff',
}

export interface OfferRule {
  buyQuantity?: number;
  getQuantity?: number;
  bundlePrice?: number;
  discountPercentage?: number;
  discountAmount?: number;
  minQuantity?: number;
}

export interface Offer {
  _id: string;
  name: string;
  description: string;
  offerType: OfferType;
  rule: OfferRule;
  applicableProducts?: string[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferDto {
  name: string;
  description: string;
  offerType: OfferType;
  rule: OfferRule;
  applicableProducts?: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  usageLimit?: number;
  priority?: number;
}

// Media types
export interface MediaUploadResponse {
  url: string;
  fileId: string;
  name: string;
  size: number;
  fileType: string;
}
