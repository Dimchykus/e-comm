import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('getUser returns the user from the service', async () => {
    const publicUser = { id: 'user-1', email: 'jane@example.com' };
    usersService.findById.mockResolvedValue(publicUser);

    await expect(controller.getUser('user-1')).resolves.toEqual(publicUser);
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
  });

  it('update forwards the id and payload to the service', async () => {
    const updated = { id: 'user-1', firstName: 'Janet' };
    usersService.update.mockResolvedValue(updated);

    await expect(
      controller.update('user-1', { firstName: 'Janet' }),
    ).resolves.toEqual(updated);
    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      firstName: 'Janet',
    });
  });

  it('delete forwards the id to the service', async () => {
    usersService.delete.mockResolvedValue(undefined);

    await controller.delete('user-1');

    expect(usersService.delete).toHaveBeenCalledWith('user-1');
  });
});
