import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Product, CreateProductDto, ProductFilters, PaginatedResponse } from '../types';

class ProductService {
  async getAll(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return await api.get<PaginatedResponse<Product>>(
      API_ENDPOINTS.PRODUCT.LIST,
      filters
    );
  }

  async getById(id: string): Promise<Product> {
    return await api.get<Product>(API_ENDPOINTS.PRODUCT.GET(id));
  }

  async getFeatured(): Promise<Product[]> {
    return await api.get<Product[]>(API_ENDPOINTS.PRODUCT.FEATURED);
  }

  async search(query: string, filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    return await api.get<PaginatedResponse<Product>>(
      API_ENDPOINTS.PRODUCT.SEARCH,
      { search: query, ...filters }
    );
  }

  async create(data: CreateProductDto): Promise<Product> {
    return await api.post<Product>(API_ENDPOINTS.PRODUCT.CREATE, data);
  }

  async update(id: string, data: Partial<CreateProductDto>): Promise<Product> {
    return await api.put<Product>(API_ENDPOINTS.PRODUCT.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.PRODUCT.DELETE(id));
  }
}

export default new ProductService();
