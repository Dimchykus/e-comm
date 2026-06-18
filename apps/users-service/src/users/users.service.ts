import { User } from '@/entities/user.entity';
import {
  PublicUser,
  SignupDto,
  toPublicUser,
  UpdateUserDto,
  UserRole,
} from '@repo/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const result = await bcrypt.hash(password, saltRounds);

    return result;
  }

  async create(signupDto: SignupDto): Promise<PublicUser> {
    const { email, password, firstName, lastName, phone, role } = signupDto;
    const user = new User();

    user.email = email;
    user.passwordHash = await this.hashPassword(password);
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone || null;
    user.role = role || UserRole.CUSTOMER;

    const savedUser = await this.usersRepository.save(user);

    return toPublicUser(savedUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    const result = await this.usersRepository.update(id, updateUserDto);

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
