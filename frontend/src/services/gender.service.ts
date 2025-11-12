import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Gender, CreateGenderDto } from '../types';

class GenderService {
  async getAll(): Promise<Gender[]> {
    return await api.get<Gender[]>(API_ENDPOINTS.GENDER.LIST);
  }

  async getById(id: string): Promise<Gender> {
    return await api.get<Gender>(API_ENDPOINTS.GENDER.GET(id));
  }

  async create(data: CreateGenderDto): Promise<Gender> {
    return await api.post<Gender>(API_ENDPOINTS.GENDER.CREATE, data);
  }

  async update(id: string, data: Partial<CreateGenderDto>): Promise<Gender> {
    return await api.put<Gender>(API_ENDPOINTS.GENDER.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.GENDER.DELETE(id));
  }
}

export default new GenderService();
