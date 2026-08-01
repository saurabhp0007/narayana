// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

// Product hierarchy types
export interface Gender {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  genderId: Gender | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: Category | string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  sku: string;
  familySKU?: string;
  description?: string;
  genderId: Gender | string;
  categoryId: Category | string;
  subcategoryId: Subcategory | string;
  sizes?: string[];
  stock: number;
  price: number;
  discountPrice?: number;
  relatedProductIds?: string[];
  underPriceAmount?: number;
  images: string[];
  videos: string[];
  sliders: string[];
  isActive: boolean;
  badge?: ProductBadge;
  isBestSeller?: boolean;
  showInLatestArrivals?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductBadge =
  | 'NEW'
  | 'SALE'
  | 'PREMIUM'
  | 'TRENDING'
  | 'COMBO'
  | 'BEST_VALUE'
  | 'LIMITED_SALE'
  | 'CASUAL'
  | 'OFFER'
  | 'UNDER_1K'
  | 'BUDGET_PICK'
  | 'LUXURY';

// Homepage "Latest Arrivals" / "Best Sellers" tab card (one per category)
export interface LatestArrivalsCategory {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  images: string[];
}

// Hero banner (independent of Offer)
export interface HeroBanner {
  _id: string;
  image: string;
  mobileImage?: string;
  subtitle?: string;
  title: string;
  buttonText?: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Curated homepage product showcase: banner + hand-picked products
export interface Collection {
  _id: string;
  name: string;
  slug: string;
  bannerImage?: string;
  productIds: string[] | Product[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Homepage "Shop by Category" tab label (independent of each product's own category)
export interface ShopCategory {
  _id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// A subcategory tile inside a homepage "Shop by Category" tab
export interface ShopSubcategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  offerText?: string;
  shopCategoryId: string | ShopCategory;
  productIds: string[] | Product[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// A subcategory tile inside one or more homepage Footwear tab groups
export interface FootwearSubcategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  offerText?: string;
  tabNames: string[];
  productIds: string[] | Product[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  customerName: string;
  location?: string;
  rating: number;
  text: string;
  verifiedPurchase: boolean;
  productId?: string;
  categoryId?: string;
  productLabel?: string;
  isApproved: boolean;
  displayOnHomepage: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSettings {
  countdownEnabled?: boolean;
  countdownEndDate?: string;
  countdownLabel?: string;
  announcementBarEnabled?: boolean;
  announcementBarText?: string;
}

// Cart types
export interface CartProduct {
  _id: string;
  name: string;
  sku: string;
  price: number;
  images: string[];
  stock: number;
  isActive: boolean;
  discountPrice?: number;
}

export interface CartItem {
  _id: string;
  product: CartProduct;
  quantity: number;
  price: number;
  itemSubtotal: number;
  productDiscount: number;
  offerDiscount: number;
  itemTotal: number;
  appliedOffer: string | null;
  addedAt: string;
}

export interface CartSummary {
  subtotal: number;
  totalProductDiscount: number;
  totalOfferDiscount: number;
  totalDiscount: number;
  total: number;
  totalItems: number;
  itemCount: number;
}

export interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

// Wishlist types
export interface WishlistItem {
  _id: string;
  userId: string;
  productId: Product;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  images: string[];
}

export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalItems: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  shippingAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// Offer types
export interface OfferRules {
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
  description?: string;
  offerType: 'buyXgetY' | 'bundleDiscount' | 'percentageOff' | 'fixedAmountOff';
  rules: OfferRules;
  productIds: string[];
  categoryIds: string[];
  subcategoryIds: string[];
  genderIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  image?: string;
  homepageSubtitle?: string;
  homepagePrice?: string;
  homepageCategory?: string;
  displayOnHomepage?: boolean;
  displayInNavbar?: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

// DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AddToCartDto {
  productId: string;
  quantity?: number;
}

export interface CreateOrderDto {
  notes?: string;
  shippingAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
}
