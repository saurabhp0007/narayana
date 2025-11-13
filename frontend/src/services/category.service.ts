import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Category, CreateCategoryDto, PaginatedResponse } from '../types';

class CategoryService {
  async getAll(): Promise<Category[]> {
    const response = await api.get<PaginatedResponse<Category>>(API_ENDPOINTS.CATEGORY.LIST);
    return response.data;
  }

  async getById(id: string): Promise<Category> {
    return await api.get<Category>(API_ENDPOINTS.CATEGORY.GET(id));
  }

  async getByGender(genderId: string): Promise<Category[]> {
    return await api.get<Category[]>(API_ENDPOINTS.CATEGORY.BY_GENDER(genderId));
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    return await api.post<Category>(API_ENDPOINTS.CATEGORY.CREATE, data);
  }

  async update(id: string, data: Partial<CreateCategoryDto>): Promise<Category> {
    return await api.patch<Category>(API_ENDPOINTS.CATEGORY.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.CATEGORY.DELETE(id));
  }
}

export default new CategoryService();
