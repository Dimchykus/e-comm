import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PublicUserDto, UpdateUserDto, USERS_PATTERNS } from '@repo/shared';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(USERS_PATTERNS.UPDATE)
  update(
    @Payload('id') id: string,
    @Payload('data') updateUserDto: UpdateUserDto,
  ): Promise<PublicUserDto> {
    return this.usersService.update(id, updateUserDto);
  }
}
