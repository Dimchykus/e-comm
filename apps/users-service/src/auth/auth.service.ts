import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { SignupDto, LoginDto } from '@repo/shared';
import { JwtService } from '@nestjs/jwt';

interface UserJwtResponse {
  user: User;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async validateUserById(userId: string) {
    return await this.usersService.findById(userId);
  }

  async signUp(signupDto: SignupDto): Promise<User> {
    return this.usersService.create(signupDto);
  }

  async login(loginDto: LoginDto): Promise<UserJwtResponse> {
    const userResult = await this.usersService.signIn(loginDto);

    if (!userResult) {
      throw new UnauthorizedException('Invalid Credentials!');
    }

    const payload = { userResult };
    const accessToken = this.jwtService.sign(payload);

    const signInResponse: UserJwtResponse = { user: userResult, accessToken };

    return signInResponse;
  }
}
