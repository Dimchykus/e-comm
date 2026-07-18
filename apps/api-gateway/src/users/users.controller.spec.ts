import { Test, TestingModule } from '@nestjs/testing';
import { MICROSERVICES, USERS_PATTERNS } from '@repo/shared';
import { firstValueFrom, of } from 'rxjs';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;

  const usersClient = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: MICROSERVICES.USERS_SERVICE, useValue: usersClient },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('getMe requests the authenticated user by id', async () => {
    const publicUser = { id: 'user-1', email: 'jane@example.com' };
    usersClient.send.mockReturnValue(of(publicUser));

    const result = await firstValueFrom(
      controller.getMe({ user: { userId: 'user-1' } }),
    );

    expect(result).toEqual(publicUser);
    expect(usersClient.send).toHaveBeenCalledWith(USERS_PATTERNS.GET, {
      id: 'user-1',
    });
  });

  it('update sends the id and update payload', async () => {
    const updated = { id: 'user-1', firstName: 'Janet' };
    usersClient.send.mockReturnValue(of(updated));

    const result = await firstValueFrom(
      controller.update('user-1', { firstName: 'Janet' }),
    );

    expect(result).toEqual(updated);
    expect(usersClient.send).toHaveBeenCalledWith(USERS_PATTERNS.UPDATE, {
      id: 'user-1',
      data: { firstName: 'Janet' },
    });
  });

  it('delete sends the id', async () => {
    usersClient.send.mockReturnValue(of(undefined));

    await firstValueFrom(controller.delete('user-1'));

    expect(usersClient.send).toHaveBeenCalledWith(USERS_PATTERNS.DELETE, {
      id: 'user-1',
    });
  });
});
