import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderStatus } from './schemas/order.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Order')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new order',
    description: 'Creates an order from the user cart',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid order data or empty cart',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrderFromCart(req.user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    description: 'Retrieves a paginated list of all orders with optional filters (admin)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '10' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status', enum: OrderStatus })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter orders from this date (ISO format)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter orders until this date (ISO format)' })
  @ApiQuery({ name: 'search', required: false, description: 'Order ID, customer name, email or phone' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: OrderStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    this.assertAdmin(req);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const filters: any = {};
    if (status) filters.status = status;
    if (fromDate) filters.fromDate = new Date(fromDate);
    if (toDate) {
      // A bare date (from a date picker) should include that whole day.
      filters.toDate = new Date(toDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) filters.toDate.setUTCHours(23, 59, 59, 999);
    }
    if (search) filters.search = search;

    return this.orderService.findAll(pageNum, limitNum, filters);
  }

  @Get('my-orders')
  @ApiOperation({
    summary: 'Get user orders',
    description: 'Retrieves a paginated list of orders for the authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '10' })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async getMyOrders(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: OrderStatus,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.orderService.findUserOrders(req.user.userId, pageNum, limitNum, status);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get order statistics',
    description: 'Retrieves order statistics for a user. Admins can view any user stats.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID to get stats for (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async getOrderStats(@Request() req, @Query('userId') userId?: string) {
    // Admins see store-wide stats (or a specific user's); customers only their own.
    const targetUserId = req.user.isAdmin ? userId : req.user.userId;
    return this.orderService.getOrderStats(targetUserId);
  }

  @Get('order-id/:orderId')
  @ApiOperation({
    summary: 'Get order by order ID',
    description: 'Retrieves a specific order by its order ID string',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID string' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async findByOrderId(@Request() req, @Param('orderId') orderId: string) {
    return this.assertCanView(req, await this.orderService.findByOrderId(orderId));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieves a specific order by its database ID',
  })
  @ApiParam({ name: 'id', description: 'Order database ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.assertCanView(req, await this.orderService.findOne(id));
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description: 'Updates the status of an order (admin operation)',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    this.assertAdmin(req);
    return this.orderService.updateStatus(id, updateOrderStatusDto);
  }

  private assertAdmin(req) {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  // Customers may only open their own orders; admins can open any.
  private assertCanView(req, order: Order) {
    const ownerId = (order.userId as any)?._id ?? order.userId;
    if (!req.user.isAdmin && ownerId?.toString() !== req.user.userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
