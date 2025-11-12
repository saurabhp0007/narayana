import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Offer, CreateOfferDto } from '../types';

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

  async create(data: CreateOfferDto): Promise<Offer> {
    return await api.post<Offer>(API_ENDPOINTS.OFFER.CREATE, data);
  }

  async update(id: string, data: Partial<CreateOfferDto>): Promise<Offer> {
    return await api.put<Offer>(API_ENDPOINTS.OFFER.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.OFFER.DELETE(id));
  }
}

export default new OfferService();
