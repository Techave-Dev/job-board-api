import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IAuthService } from './interfaces/auth.service.interface';
import { type RegisterDto, RegisterSchema } from './dto/register.dto';
import { type LoginDto, LoginSchema } from './dto/login.dto';
import {
  type RefreshTokenDto,
  RefreshTokenSchema,
} from './dto/refresh-token.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse as ApiRes } from '../../common/types/api-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IAuthService) private readonly authService: IAuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'name', 'role'],
      properties: {
        email: { type: 'string', example: 'alice@example.com' },
        password: { type: 'string', example: 'password123' },
        name: { type: 'string', example: 'Alice' },
        role: { type: 'string', enum: ['applicant', 'company'] },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    content: {
      'application/json': {
        example: {
          message: 'User registered successfully',
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
    status: 409,
    description: 'Email already exists',
    content: {
      'application/json': {
        example: {
          statusCode: 409,
          error: 'Conflict',
          message: ['Email already exists'],
        },
      },
    },
  })
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ): Promise<ApiRes> {
    const { user } = await this.authService.register(dto);
    return new ApiRes('User registered successfully', user);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'alice@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    content: {
      'application/json': {
        example: {
          message: 'Login successful',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIs...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
            user: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'alice@example.com',
              name: 'Alice',
              role: 'applicant',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          error: 'Unauthorized',
          message: ['Invalid credentials'],
        },
      },
    },
  })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ): Promise<ApiRes> {
    const { user, tokens } = await this.authService.login(dto);
    return new ApiRes('Login successful', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    content: {
      'application/json': {
        example: {
          message: 'Token rotated successfully',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIs...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
          },
        },
      },
    },
  })
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
  ): Promise<ApiRes> {
    const tokens = await this.authService.rotate(dto);
    return new ApiRes('Token rotated successfully', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(dto);
  }
}
