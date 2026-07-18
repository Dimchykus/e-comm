import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  MICROSERVICES,
  PublicUserDto,
  UpdateUserDto,
  USERS_PATTERNS,
} from '@repo/shared';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(MICROSERVICES.USERS_SERVICE)
    private readonly usersClient: ClientProxy,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user',
    type: PublicUserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  getMe(
    @Request() req: { user: { userId: string } },
  ): Observable<PublicUserDto> {
    return this.usersClient.send<PublicUserDto>(USERS_PATTERNS.GET, {
      id: req.user.userId,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Updated user',
    type: PublicUserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Observable<PublicUserDto> {
    return this.usersClient.send<PublicUserDto>(USERS_PATTERNS.UPDATE, {
      id,
      data: updateUserDto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id', ParseUUIDPipe) id: string): Observable<void> {
    return this.usersClient.send<void>(USERS_PATTERNS.DELETE, { id });
  }
}
