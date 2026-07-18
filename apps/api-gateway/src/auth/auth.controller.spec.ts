import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MICROSERVICES, USERS_PATTERNS } from '@repo/shared';
import { of, throwError } from 'rxjs';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const usersClient = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: MICROSERVICES.USERS_SERVICE, useValue: usersClient },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('signup forwards the dto to the users service', async () => {
    const signupDto = {
      email: 'jane@example.com',
      password: 'secret123',
      firstName: 'Jane',
      lastName: 'Doe',
    };
    const publicUser = { id: 'user-1', email: signupDto.email };
    usersClient.send.mockReturnValue(of(publicUser));

    await expect(controller.signup(signupDto)).resolves.toEqual(publicUser);
    expect(usersClient.send).toHaveBeenCalledWith(
      USERS_PATTERNS.SIGNUP,
      signupDto,
    );
  });

  it('login forwards the credentials and returns the token response', async () => {
    const loginDto = { email: 'jane@example.com', password: 'secret123' };
    const response = { user: { id: 'user-1' }, accessToken: 'token' };
    usersClient.send.mockReturnValue(of(response));

    await expect(controller.login(loginDto)).resolves.toEqual(response);
    expect(usersClient.send).toHaveBeenCalledWith(
      USERS_PATTERNS.LOGIN,
      loginDto,
    );
  });

  it('maps RPC errors back to HttpExceptions with the original status', async () => {
    usersClient.send.mockReturnValue(
      throwError(() => ({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      })),
    );

    const promise = controller.login({
      email: 'jane@example.com',
      password: 'wrong',
    });

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await promise.catch((err: HttpException) => {
      expect(err.getStatus()).toBe(401);
    });
  });
});
