import { User } from '@/entities/user.entity';
import { LoginDto, SignupDto } from '@repo/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const result = await bcrypt.hash(password, salt);

    return result;
  }

  async create(signupDto: SignupDto): Promise<User> {
    const { email, password, firstName, lastName, phone, role } = signupDto;
    const user = new User();

    user.email = email;
    user.passwordHash = await this.hashPassword(password, '12312');
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.role = role;

    await this.usersRepository.save(user);

    return user;
  }

  async signIn(loginDto: LoginDto): Promise<User | null> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (user && user.validatePassword(password)) {
      return user;
    } else {
      return null;
    }
  }
}
