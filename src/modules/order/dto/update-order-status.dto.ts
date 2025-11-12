import { IsEnum } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: 'Status must be one of: pending, confirmed, shipped, delivered, cancelled',
  })
  status: OrderStatus;
}
