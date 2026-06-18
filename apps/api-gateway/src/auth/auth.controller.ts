import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MICROSERVICES, SignupDto, USERS_PATTERNS } from '@repo/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(MICROSERVICES.USERS_SERVICE)
    private readonly usersClient: ClientProxy,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signup(@Body() signupDto: SignupDto) {
    return this.usersClient.send(USERS_PATTERNS.SIGNUP, signupDto);
  }
}
