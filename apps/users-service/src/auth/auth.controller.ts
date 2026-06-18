// auth.controller.ts
import { Controller, Body } from '@nestjs/common';
import {
  SignupDto,
  LoginDto,
  USERS_PATTERNS,
  PublicUserDto,
} from '@repo/shared';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Get('google')
  // @UseGuards(AuthGuard('google'))
  // async googleAuth() {}

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // googleAuthRedirect(@Req() req) {
  //   // Here, req.user contains the profile data from your GoogleStrategy
  //   // You should generate your own JWT access token here and return it
  //   return {
  //     message: 'User info from Google',
  //     user: req.user,
  //   };
  // }

  @MessagePattern(USERS_PATTERNS.SIGNUP)
  signup(@Body() signupDto: SignupDto): Promise<PublicUserDto> {
    return this.authService.signUp(signupDto);
  }

  @MessagePattern(USERS_PATTERNS.LOGIN)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
