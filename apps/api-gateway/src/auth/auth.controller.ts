import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  MICROSERVICES,
  SignupDto,
  USERS_PATTERNS,
} from '@repo/shared';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { toHttpException } from '../common/rpc-error.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(MICROSERVICES.USERS_SERVICE)
    private readonly usersClient: ClientProxy,
  ) {}

  private send<T = unknown>(pattern: string, payload: unknown): Promise<T> {
    return firstValueFrom(
      this.usersClient
        .send<T>(pattern, payload)
        .pipe(catchError((err) => throwError(() => toHttpException(err)))),
    );
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signup(@Body() signupDto: SignupDto) {
    return this.send(USERS_PATTERNS.SIGNUP, signupDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive an access token' })
  @ApiResponse({
    status: 201,
    description: 'Authenticated; returns access token',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.send(USERS_PATTERNS.LOGIN, loginDto);
  }
}
