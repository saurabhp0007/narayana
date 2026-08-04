import { create } from 'zustand';
import { CartItem, CartSummary } from '@/types';
import { cartApi, guestApi } from '@/lib/api';

interface CartState {
  items: CartItem[];
  summary: CartSummary | null;
  count: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: (guestId?: string | null) => Promise<void>;
  fetchCount: (guestId?: string | null) => Promise<void>;
  addToCart: (productId: string, quantity?: number, guestId?: string | null, size?: string) => Promise<void>;
  updateQuantity: (itemId: string | undefined, quantity: number, productId?: string, guestId?: string | null, size?: string) => Promise<void>;
  removeFromCart: (itemId: string | undefined, productId?: string, guestId?: string | null, size?: string) => Promise<void>;
  clearCart: (guestId?: string | null) => Promise<void>;
  clearError: () => void;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  summary: null,
  count: 0,
  isLoading: false,
  error: null,

  fetchCart: async (guestId?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      let response;
      if (guestId) {
        response = await guestApi.getCart(guestId);
      } else {
        response = await cartApi.get();
      }
      const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      const summary = response.data?.summary || null;
      set({ items, summary, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch cart',
        isLoading: false
      });
    }
  },

  fetchCount: async (guestId?: string | null) => {
    try {
      let response;
      if (guestId) {
        response = await guestApi.getCartCount(guestId);
      } else {
        response = await cartApi.getCount();
      }
      set({ count: response.data.count || 0 });
    } catch {
      // Silently fail for count
    }
  },

  addToCart: async (productId: string, quantity: number = 1, guestId?: string | null, size?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (guestId) {
        await guestApi.addToCart({ guestId, productId, quantity, size });
        const response = await guestApi.getCart(guestId);
        const countResponse = await guestApi.getCartCount(guestId);
        const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const summary = response.data?.summary || null;
        set({
          items,
          summary,
          count: countResponse.data.count || 0,
          isLoading: false
        });
      } else {
        await cartApi.add({ productId, quantity, size });
        const response = await cartApi.get();
        const countResponse = await cartApi.getCount();
        const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const summary = response.data?.summary || null;
        set({
          items,
          summary,
          count: countResponse.data.count || 0,
          isLoading: false
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to add to cart',
        isLoading: false
      });
      throw error;
    }
  },

  updateQuantity: async (itemId: string | undefined, quantity: number, productId?: string, guestId?: string | null, size?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (guestId && productId) {
        await guestApi.updateCartItem({ guestId, productId, quantity, size });
        const response = await guestApi.getCart(guestId);
        const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const summary = response.data?.summary || null;
        set({ items, summary, isLoading: false });
      } else {
        if (!itemId) {
          throw new Error('Missing cart item id');
        }
        await cartApi.update(itemId, quantity);
        const response = await cartApi.get();
        const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const summary = response.data?.summary || null;
        set({ items, summary, isLoading: false });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to update cart',
        isLoading: false
      });
      throw error;
    }
  },

  removeFromCart: async (itemId: string | undefined, productId?: string, guestId?: string | null, size?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (guestId && productId) {
        await guestApi.removeFromCart(guestId, productId, size);
        const response = await guestApi.getCart(guestId);
        const countResponse = await guestApi.getCartCount(guestId);
        const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const summary = response.data?.summary || null;
        set({
          items,
          summary,
          count: countResponse.data.count || 0,
          isLoading: false
        });
      } else {
        if (!itemId) {
          throw new Error('Missing cart item id');
        }
        await cartApi.remove(itemId);
        const response = await cartApi.get();
        const countResponse = await cartApi.getCount();
        const items = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const summary = response.data?.summary || null;
        set({
          items,
          summary,
          count: countResponse.data.count || 0,
          isLoading: false
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to remove from cart',
        isLoading: false
      });
      throw error;
    }
  },

  clearCart: async (guestId?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      if (guestId) {
        await guestApi.clearCart(guestId);
      } else {
        await cartApi.clear();
      }
      set({ items: [], summary: null, count: 0, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to clear cart',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  resetCart: () => set({ items: [], summary: null, count: 0, error: null }),
}));
