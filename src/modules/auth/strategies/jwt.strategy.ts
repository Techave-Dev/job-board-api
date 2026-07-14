import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthRepository } from '../interfaces/auth.repository.interface';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface RequestUser {
  userId: string;
  email: string;
  name: string;
  role: 'applicant' | 'company';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IAuthRepository) private readonly authRepository: IAuthRepository,
  ) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required but was not provided',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.authRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException({
        code: 'auth.unauthorized',
        message: 'User not found',
      });
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
