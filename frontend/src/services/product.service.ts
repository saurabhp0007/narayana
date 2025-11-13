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
    return await api.patch<Product>(API_ENDPOINTS.PRODUCT.UPDATE(id), data);
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.PRODUCT.DELETE(id));
  }

  async autosuggest(query: string, limit?: number): Promise<{
    products: Array<{
      _id: string;
      name: string;
      sku: string;
      price: number;
      discountPrice?: number;
      image: string | null;
      type: 'product';
    }>;
    categories: Array<{
      _id: string;
      name: string;
      slug: string;
      type: 'category';
    }>;
    subcategories: Array<{
      _id: string;
      name: string;
      slug: string;
      type: 'subcategory';
    }>;
  }> {
    return await api.get(`${API_ENDPOINTS.PRODUCT.LIST}/autosuggest`, { q: query, limit });
  }
}

export default new ProductService();
