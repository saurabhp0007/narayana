import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  getHello(): object {
    return {
      message: 'Welcome to eCommerce CMS Backend API',
      version: '2.0.0',
      environment: this.configService.get<string>('app.nodeEnv'),
      documentation: '/api',
    };
  }

  @Get('health')
  healthCheck(): object {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      environment: this.configService.get<string>('app.nodeEnv'),
    };
  }

  @Get('readiness')
  readinessCheck(): object {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('liveness')
  livenessCheck(): object {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }
}
