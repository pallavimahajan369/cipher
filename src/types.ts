export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviewsCount: number;
  image: string;
  colors: string[];
  sizes?: string[];
  badge?: string;
  inStock: boolean;
  featured?: boolean;
  reviews: Review[];
}

export interface CartItem {
  id: string; // unique cart item id (e.g. `${productId}-${color}-${size}`)
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    image: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendedProductIds?: string[];
}

export interface User {
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
  preferredVibe?: string;
}

