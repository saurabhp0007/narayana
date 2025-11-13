import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Subcategory, CreateSubcategoryDto } from '../types';

class SubcategoryService {
  async getAll(): Promise<Subcategory[]> {
    return await api.get<Subcategory[]>(API_ENDPOINTS.SUBCATEGORY.LIST);
  }

  async getById(id: string): Promise<Subcategory> {
    return await api.get<Subcategory>(API_ENDPOINTS.SUBCATEGORY.GET(id));
  }

  async getByCategory(categoryId: string): Promise<Subcategory[]> {
    return await api.get<Subcategory[]>(
      API_ENDPOINTS.SUBCATEGORY.BY_CATEGORY(categoryId)
    );
  }

  async create(data: CreateSubcategoryDto): Promise<Subcategory> {
    return await api.post<Subcategory>(API_ENDPOINTS.SUBCATEGORY.CREATE, data);
  }

  async update(id: string, data: Partial<CreateSubcategoryDto>): Promise<Subcategory> {
    return await api.patch<Subcategory>(API_ENDPOINTS.SUBCATEGORY.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.SUBCATEGORY.DELETE(id));
  }
}

export default new SubcategoryService();
