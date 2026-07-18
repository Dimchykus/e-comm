import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '@repo/shared';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '@/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const usersRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const user = Object.assign(new User(), {
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
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('returns the public user when found', async () => {
      usersRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result).toMatchObject({ id: 'user-1', email: user.email });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('hashes the password and defaults the role to customer', async () => {
      usersRepository.save.mockImplementation((toSave: User) =>
        Promise.resolve(Object.assign(toSave, { id: 'user-1' })),
      );

      const result = await service.create({
        email: 'jane@example.com',
        password: 'secret123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      const [savedUser] = usersRepository.save.mock.calls[0] as [User];
      expect(savedUser.passwordHash).not.toBe('secret123');
      expect(bcrypt.compareSync('secret123', savedUser.passwordHash)).toBe(
        true,
      );
      expect(savedUser.role).toBe(UserRole.CUSTOMER);
      expect(result).toMatchObject({ id: 'user-1', email: 'jane@example.com' });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('update', () => {
    it('updates the user and returns the fresh public user', async () => {
      usersRepository.update.mockResolvedValue({ affected: 1 });
      usersRepository.findOneBy.mockResolvedValue(user);

      const result = await service.update('user-1', { firstName: 'Janet' });

      expect(usersRepository.update).toHaveBeenCalledWith('user-1', {
        firstName: 'Janet',
      });
      expect(result).toMatchObject({ id: 'user-1' });
    });

    it('throws NotFoundException when no row was affected', async () => {
      usersRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.update('missing', { firstName: 'Janet' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the user by id', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete('user-1');

      expect(usersRepository.delete).toHaveBeenCalledWith('user-1');
    });
  });
});
