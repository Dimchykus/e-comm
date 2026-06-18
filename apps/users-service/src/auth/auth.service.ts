import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignupDto, LoginDto, PublicUser, toPublicUser } from '@repo/shared';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';

export interface UserJwtResponse {
  user: PublicUser;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  async validateUserById(userId: string) {
    return await this.usersService.findById(userId);
  }

  async signUp(signupDto: SignupDto): Promise<PublicUser> {
    return this.usersService.create(signupDto);
  }

  async validateUser(loginDto: LoginDto): Promise<PublicUser | null> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (user && user.validatePassword(password)) {
      return toPublicUser(user);
    } else {
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<UserJwtResponse> {
    const userResult = await this.validateUser(loginDto);

    if (!userResult) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    }

    const payload = { sub: userResult.id, email: userResult.email };
    const accessToken = this.jwtService.sign(payload);

    const signInResponse: UserJwtResponse = { user: userResult, accessToken };

    return signInResponse;
  }
}
