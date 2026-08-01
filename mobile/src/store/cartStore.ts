import { create } from 'zustand';
import api from '../lib/api';
import { CartItem, CartSummary } from '../types';

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  count: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCount: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  summary: {
    subtotal: 0,
    totalProductDiscount: 0,
    totalOfferDiscount: 0,
    totalDiscount: 0,
    total: 0,
    totalItems: 0,
    itemCount: 0,
  },
  count: 0,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/cart');
      const { items, summary } = response.data;
      set({
        items,
        summary,
        count: items.length,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch cart',
        isLoading: false,
      });
    }
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/cart', { productId, quantity });
      await get().fetchCart();
      await get().fetchCount();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to add to cart',
        isLoading: false,
      });
      throw error;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/cart/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update quantity',
        isLoading: false,
      });
    }
  },

  removeFromCart: async (itemId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/cart/${itemId}`);
      await get().fetchCart();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to remove item',
        isLoading: false,
      });
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.delete('/cart');
      set({
        items: [],
        summary: {
          subtotal: 0,
          totalProductDiscount: 0,
          totalOfferDiscount: 0,
          totalDiscount: 0,
          total: 0,
          totalItems: 0,
          itemCount: 0,
        },
        count: 0,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to clear cart',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchCount: async () => {
    try {
      const response = await api.get('/cart');
      set({ count: response.data.items?.length || 0 });
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
