// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SignupDto } from '@repo/shared';
import { User } from '@/entities/user.entity';
import { AuthService } from './auth.service';

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

  @Post('signup')
  signup(@Body() signupDto: SignupDto): Promise<User> {
    return this.authService.signUp(signupDto);
  }

  // @Put('login')
  // login(@Body() loginDto: LoginDto): Promise<UserJwtResponse> {
  //   return this.authService.login(loginDto);
  // }
}
