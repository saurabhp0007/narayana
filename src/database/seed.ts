import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../modules/admin/admin.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const adminService = app.get(AdminService);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecommerce-cms.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    // Check if admin already exists
    const existingAdmin = await adminService.findByEmail(adminEmail);

    if (existingAdmin) {
      logger.log(`Admin with email ${adminEmail} already exists`);
    } else {
      await adminService.createAdmin(adminEmail, adminPassword);
      logger.log(`Admin created successfully with email: ${adminEmail}`);
      logger.log(`Please change the default password after first login`);
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
