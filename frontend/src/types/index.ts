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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenderDto {
  name: string;
  slug?: string;
  isActive?: boolean;
}

// Category types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  genderId: string | Gender; // Can be populated
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  genderId: string;
  isActive?: boolean;
}

// Subcategory types
export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | Category; // Can be populated
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcategoryDto {
  name: string;
  slug?: string;
  categoryId: string;
  isActive?: boolean;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  sku: string;
  familySKU?: string;
  description?: string;
  genderId: string | Gender; // Can be populated
  categoryId: string | Category; // Can be populated
  subcategoryId: string | Subcategory; // Can be populated
  sizes?: string[];
  stock: number;
  price: number;
  discountPrice?: number;
  discountedPrice?: number; // Calculated price with discounts
  relatedProductIds?: string[];
  underPriceAmount?: number;
  images: string[];
  videos?: string[];
  sliders?: string[];
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  sku?: string;
  familySKU?: string;
  description?: string;
  genderId: string;
  categoryId: string;
  subcategoryId: string;
  sizes?: string[];
  stock: number;
  price: number;
  discountPrice?: number;
  relatedProductIds?: string[];
  underPriceAmount?: number;
  images?: string[];
  videos?: string[];
  sliders?: string[];
  isActive?: boolean;
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
  itemSubtotal: number;
  productDiscount: number;
  offerDiscount: number;
  itemTotal: number;
  appliedOffer?: {
    _id: string;
    name: string;
    description?: string;
    offerType: OfferType;
  } | null;
  subtotal?: number; // Deprecated - use itemTotal
}

export interface Cart {
  items: CartItem[];
  summary: {
    subtotal: number;
    totalProductDiscount: number;
    totalOfferDiscount: number;
    totalDiscount: number;
    total: number;
    totalItems: number;
    itemCount: number;
  };
  totalItems?: number; // Deprecated - use summary.totalItems
  totalPrice?: number; // Deprecated - use summary.total
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
