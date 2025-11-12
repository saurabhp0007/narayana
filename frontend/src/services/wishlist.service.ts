import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Wishlist } from '../types';

class WishlistService {
  async getWishlist(): Promise<Wishlist> {
    return await api.get<Wishlist>(API_ENDPOINTS.WISHLIST.GET);
  }

  async addToWishlist(productId: string): Promise<Wishlist> {
    return await api.post<Wishlist>(API_ENDPOINTS.WISHLIST.ADD, { productId });
  }

  async removeFromWishlist(itemId: string): Promise<Wishlist> {
    return await api.delete<Wishlist>(API_ENDPOINTS.WISHLIST.REMOVE(itemId));
  }

  async clearWishlist(): Promise<void> {
    await api.delete(API_ENDPOINTS.WISHLIST.CLEAR);
  }
}

export default new WishlistService();
