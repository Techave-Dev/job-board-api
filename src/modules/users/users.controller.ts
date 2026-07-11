import { Controller, Get, Patch, Body, Inject } from '@nestjs/common';
import { IUsersService } from './interfaces/users.service.interface';
import { type UpdateUserDto, UpdateUserSchema } from './dto/update-user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(IUsersService) private readonly usersService: IUsersService,
  ) {}

  @Get('me')
  async getProfile(
    @CurrentUser('userId') userId: string,
  ): Promise<ApiResponse> {
    const user = await this.usersService.getProfile(userId);
    return new ApiResponse('Profile fetched successfully', user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
  ): Promise<ApiResponse> {
    const user = await this.usersService.updateProfile(userId, dto);
    return new ApiResponse('Profile updated successfully', user);
  }
}
