import { Controller, Get, Patch, Body, Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { IUsersService } from './interfaces/users.service.interface';
import { type UpdateUserDto, UpdateUserSchema } from './dto/update-user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse as ApiRes } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @Inject(IUsersService) private readonly usersService: IUsersService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Profile fetched successfully',
          data: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'alice@example.com',
            name: 'Alice',
            role: 'applicant',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          error: 'Unauthorized',
          message: ['Unauthorized'],
        },
      },
    },
  })
  async getProfile(@CurrentUser('userId') userId: string): Promise<ApiRes> {
    const user = await this.usersService.getProfile(userId);
    return new ApiRes('Profile fetched successfully', user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Alice Updated' },
        email: { type: 'string', example: 'alice-new@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    content: {
      'application/json': {
        example: {
          message: 'Profile updated successfully',
          data: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'alice-new@example.com',
            name: 'Alice Updated',
            role: 'applicant',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['name is required'],
        },
      },
    },
  })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
  ): Promise<ApiRes> {
    const user = await this.usersService.updateProfile(userId, dto);
    return new ApiRes('Profile updated successfully', user);
  }
}
