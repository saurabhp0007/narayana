import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    const admin = await this.adminService.findByEmail(email);

    if (!admin) {
      return null;
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is inactive');
    }

    const isPasswordValid = await this.adminService.validatePassword(password, admin.password);

    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = admin.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const admin = await this.validateAdmin(loginDto.email, loginDto.password);

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login timestamp
    await this.adminService.updateLastLogin(admin._id);

    const payload: JwtPayload = {
      userId: admin._id.toString(),
      email: admin.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      admin: {
        id: admin._id,
        email: admin.email,
        lastLoginAt: new Date(),
      },
    };
  }

  async getProfile(userId: string) {
    const admin = await this.adminService.findById(userId);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    return admin;
  }
}
