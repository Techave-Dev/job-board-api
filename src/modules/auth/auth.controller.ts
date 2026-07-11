import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { IAuthService } from './interfaces/auth.service.interface';
import { type RegisterDto, RegisterSchema } from './dto/register.dto';
import { type LoginDto, LoginSchema } from './dto/login.dto';
import {
  type RefreshTokenDto,
  RefreshTokenSchema,
} from './dto/refresh-token.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse } from '../../common/types/api-response';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IAuthService) private readonly authService: IAuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ): Promise<ApiResponse> {
    const { user } = await this.authService.register(dto);
    return new ApiResponse('User registered successfully', user);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ): Promise<ApiResponse> {
    const { user, tokens } = await this.authService.login(dto);
    return new ApiResponse('Login successful', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
  ): Promise<ApiResponse> {
    const tokens = await this.authService.rotate(dto);
    return new ApiResponse('Token rotated successfully', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(dto);
  }
}
