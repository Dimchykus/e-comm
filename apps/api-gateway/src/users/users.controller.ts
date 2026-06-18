import {
  Body,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MICROSERVICES, UpdateUserDto, USERS_PATTERNS } from '@repo/shared';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(MICROSERVICES.USERS_SERVICE)
    private readonly usersClient: ClientProxy,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersClient.send(USERS_PATTERNS.UPDATE, {
      id,
      data: updateUserDto,
    });
  }
}
