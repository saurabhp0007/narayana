import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../modules/admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  try {
    // Create default admin user
    const adminData = {
      email: 'admin@example.com',
      password: 'Admin@123',
      name: 'Admin User',
    };

    const existingAdmin = await adminService.findByEmail(adminData.email);

    if (existingAdmin) {
      console.log('❌ Admin user already exists with email:', adminData.email);
    } else {
      await adminService.create(adminData);
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('\n⚠️  Please change the password after first login!');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();
