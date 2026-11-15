export type GarmentSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface GarmentColor {
  name: string;
  hex: string;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  originalPrice: number;
  discountPrice: number;
  sizes: GarmentSize[];
  colors: GarmentColor[];
  images: string[];
  stock: number;
  status: ProductStatus;
  featured: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: unknown;
}

export interface CartItem {
  key: string; // productId + size + colorName
  productId: string;
  name: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  size: GarmentSize;
  color: GarmentColor;
  quantity: number;
  maxStock: number;
}

export type PaymentMethod =
  | 'Cash on Delivery'
  | 'Bank Transfer'
  | 'Easypaisa'
  | 'JazzCash';

export type PaymentStatus =
  | 'Cash on Delivery'
  | 'Awaiting Verification'
  | 'Verified'
  | 'Failed';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  userId: string;
  isGuest: boolean;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode?: string;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  active: boolean;
  description?: string;
  createdAt?: unknown;
}

export interface CustomerRecord {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  displayName?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  wishlist: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'resolved';
  createdAt?: unknown;
}

export type RoutePage =
  | 'home'
  | 'shop'
  | 'mens-shirts'
  | 'mens-trousers'
  | 'jeans'
  | 't-shirts'
  | 'product'
  | 'wishlist'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'orders'
  | 'about'
  | 'contact'
  | 'admin';
