import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Cart, AddToCartDto } from '../types';

class CartService {
  async getCart(): Promise<Cart> {
    return await api.get<Cart>(API_ENDPOINTS.CART.GET);
  }

  async addToCart(data: AddToCartDto): Promise<Cart> {
    return await api.post<Cart>(API_ENDPOINTS.CART.ADD, data);
  }

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    return await api.patch<Cart>(API_ENDPOINTS.CART.UPDATE(itemId), { quantity });
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    return await api.delete<Cart>(API_ENDPOINTS.CART.REMOVE(itemId));
  }

  async clearCart(): Promise<void> {
    await api.delete(API_ENDPOINTS.CART.CLEAR);
  }
}

export default new CartService();
