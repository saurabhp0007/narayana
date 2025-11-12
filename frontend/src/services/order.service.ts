import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Order, CreateOrderDto, OrderStatus } from '../types';

class OrderService {
  async getAll(): Promise<Order[]> {
    return await api.get<Order[]>(API_ENDPOINTS.ORDER.LIST);
  }

  async getById(id: string): Promise<Order> {
    return await api.get<Order>(API_ENDPOINTS.ORDER.GET(id));
  }

  async getUserOrders(): Promise<Order[]> {
    return await api.get<Order[]>(API_ENDPOINTS.ORDER.USER_ORDERS);
  }

  async create(data: CreateOrderDto): Promise<Order> {
    return await api.post<Order>(API_ENDPOINTS.ORDER.CREATE, data);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return await api.patch<Order>(API_ENDPOINTS.ORDER.UPDATE_STATUS(id), { status });
  }
}

export default new OrderService();
