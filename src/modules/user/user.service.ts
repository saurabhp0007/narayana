import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto, UpdatePasswordDto } from './dto/update-user.dto';
import { AddAddressDto } from './dto/add-address.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: registerUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    // Create user
    const user = new this.userModel({
      ...registerUserDto,
      password: hashedPassword,
    });

    await user.save();

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email, isActive: true }).exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({ email: updateUserDto.email });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateUserDto);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current password
    const isValid = await this.validatePassword(updatePasswordDto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  // Address Management
  async addAddress(userId: string, addAddressDto: AddAddressDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If this is marked as default, unset other defaults
    if (addAddressDto.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      addAddressDto.isDefault = true;
    }

    user.addresses.push(addAddressDto as any);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async updateAddress(userId: string, addressIndex: number, addAddressDto: AddAddressDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (addressIndex < 0 || addressIndex >= user.addresses.length) {
      throw new BadRequestException('Invalid address index');
    }

    // If this is marked as default, unset other defaults
    if (addAddressDto.isDefault) {
      user.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    user.addresses[addressIndex] = addAddressDto as any;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async deleteAddress(userId: string, addressIndex: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (addressIndex < 0 || addressIndex >= user.addresses.length) {
      throw new BadRequestException('Invalid address index');
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default and there are more addresses, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async setDefaultAddress(userId: string, addressIndex: number): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (addressIndex < 0 || addressIndex >= user.addresses.length) {
      throw new BadRequestException('Invalid address index');
    }

    // Unset all defaults
    user.addresses.forEach(addr => addr.isDefault = false);
    // Set new default
    user.addresses[addressIndex].isDefault = true;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }
}
