import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Offer, CreateOfferDto, OfferType } from '../types';

class OfferService {
  async getAll(): Promise<Offer[]> {
    return await api.get<Offer[]>(API_ENDPOINTS.OFFER.LIST);
  }

  async getActive(): Promise<Offer[]> {
    return await api.get<Offer[]>(API_ENDPOINTS.OFFER.ACTIVE);
  }

  async getById(id: string): Promise<Offer> {
    return await api.get<Offer>(API_ENDPOINTS.OFFER.GET(id));
  }

  async getOffersForProduct(productId: string): Promise<Offer[]> {
    return await api.get<Offer[]>(`/offers/product/${productId}`);
  }

  async create(data: CreateOfferDto): Promise<Offer> {
    return await api.post<Offer>(API_ENDPOINTS.OFFER.CREATE, data);
  }

  async update(id: string, data: Partial<CreateOfferDto>): Promise<Offer> {
    return await api.put<Offer>(API_ENDPOINTS.OFFER.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.OFFER.DELETE(id));
  }

  /**
   * Format offer description for display
   */
  formatOfferDescription(offer: Offer): string {
    switch (offer.offerType) {
      case OfferType.BUY_X_GET_Y:
        return `Buy ${offer.rule.buyQuantity} Get ${offer.rule.getQuantity} Free`;

      case OfferType.BUNDLE_DISCOUNT:
        return `Buy ${offer.rule.minQuantity}+ for ₹${offer.rule.bundlePrice}`;

      case OfferType.PERCENTAGE_OFF:
        const minQty = offer.rule.minQuantity || 1;
        const prefix = minQty > 1 ? `Buy ${minQty}+ & Get ` : '';
        return `${prefix}${offer.rule.discountPercentage}% OFF`;

      case OfferType.FIXED_AMOUNT_OFF:
        const minQtyFixed = offer.rule.minQuantity || 1;
        const prefixFixed = minQtyFixed > 1 ? `Buy ${minQtyFixed}+ & Save ` : 'Save ';
        return `${prefixFixed}₹${offer.rule.discountAmount}`;

      default:
        return offer.name;
    }
  }

  /**
   * Check if offer is currently valid
   */
  isOfferValid(offer: Offer): boolean {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return offer.isActive && now >= start && now <= end;
  }

  /**
   * Get best offer badge color
   */
  getOfferBadgeColor(offerType: OfferType): string {
    switch (offerType) {
      case OfferType.BUY_X_GET_Y:
        return '#ff6f00'; // Deep orange
      case OfferType.BUNDLE_DISCOUNT:
        return '#d32f2f'; // Red
      case OfferType.PERCENTAGE_OFF:
        return '#388e3c'; // Green
      case OfferType.FIXED_AMOUNT_OFF:
        return '#1976d2'; // Blue
      default:
        return '#6200ee'; // Purple
    }
  }
}

export default new OfferService();
