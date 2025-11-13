import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UpdateUserDto, UpdatePasswordDto } from './dto/update-user.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.userService.register(registerUserDto);

    // Auto-login after registration
    const payload = {
      userId: user._id.toString(),
      email: user.email,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() userLoginDto: UserLoginDto) {
    const user = await this.userService.findByEmail(userLoginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.userService.validatePassword(
      userLoginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.userService.updateLastLogin(user._id.toString());

    const payload = {
      userId: user._id.toString(),
      email: user.email,
    };
    const accessToken = this.jwtService.sign(payload);

    const userObj = user.toObject();
    delete userObj.password;

    return {
      accessToken,
      user: userObj,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateProfile(req.user.userId, updateUserDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() updatePasswordDto: UpdatePasswordDto) {
    await this.userService.updatePassword(req.user.userId, updatePasswordDto);
    return { message: 'Password updated successfully' };
  }

  // Address Management
  @Post('address')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addAddress(@Request() req, @Body() addAddressDto: AddAddressDto) {
    return this.userService.addAddress(req.user.userId, addAddressDto);
  }

  @Patch('address/:index')
  @UseGuards(JwtAuthGuard)
  async updateAddress(
    @Request() req,
    @Param('index') index: string,
    @Body() addAddressDto: AddAddressDto,
  ) {
    const addressIndex = parseInt(index, 10);
    return this.userService.updateAddress(req.user.userId, addressIndex, addAddressDto);
  }

  @Delete('address/:index')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAddress(@Request() req, @Param('index') index: string) {
    const addressIndex = parseInt(index, 10);
    return this.userService.deleteAddress(req.user.userId, addressIndex);
  }

  @Post('address/:index/set-default')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setDefaultAddress(@Request() req, @Param('index') index: string) {
    const addressIndex = parseInt(index, 10);
    return this.userService.setDefaultAddress(req.user.userId, addressIndex);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    // With JWT, logout is handled client-side by removing the token
    return { message: 'Logged out successfully' };
  }
}
