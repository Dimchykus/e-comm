import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '@repo/shared';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '@/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    create: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };
  const usersRepository = {
    findOne: jest.fn(),
  };

  const buildUser = (): User =>
    Object.assign(new User(), {
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash: 'hashed-password',
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
    });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('delegates user creation to UsersService', async () => {
      const signupDto = {
        email: 'jane@example.com',
        password: 'secret123',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const publicUser = { id: 'user-1', email: signupDto.email };
      usersService.create.mockResolvedValue(publicUser);

      await expect(service.signUp(signupDto)).resolves.toEqual(publicUser);
      expect(usersService.create).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'jane@example.com', password: 'secret123' };

    it('returns the user and a signed access token for valid credentials', async () => {
      const user = buildUser();
      jest.spyOn(user, 'validatePassword').mockReturnValue(true);
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.login(loginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toMatchObject({ id: 'user-1', email: user.email });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects with an RpcException when the email is unknown', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        RpcException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('rejects with an RpcException when the password is wrong', async () => {
      const user = buildUser();
      jest.spyOn(user, 'validatePassword').mockReturnValue(false);
      usersRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        RpcException,
      );
    });
  });
});
