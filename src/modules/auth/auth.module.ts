import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IAuthService } from './interfaces/auth.service.interface';
import { IAuthRepository } from './interfaces/auth.repository.interface';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [
    {
      provide: IAuthService,
      useClass: AuthService,
    },
    {
      provide: IAuthRepository,
      useClass: AuthRepository,
    },
    JwtStrategy,
  ],
  exports: [IAuthService, IAuthRepository],
})
export class AuthModule {}
