// src/auth/strategies/ws-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { log } from '@pnpmworkspace/logger';

import { JwtRequestPayload } from 'src/types/socket.types';

interface WS_JWT_PAYLOAD {
  sub: string;
}

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'ws-jwt') {
  private readonly logger = log;

  constructor(private usersService: UsersService) {
    super({
      // Extract token from Socket.IO handshake auth
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: JwtRequestPayload): string | null => {
          const token = req.handshake.auth?.token as string;
          if (token && typeof token === 'string') return token;

          const headerAuth = req.handshake.headers?.authorization;
          if (headerAuth) return headerAuth.replace('Bearer ', '');

          const requestAuth = req.request.headers?.authorization;
          if (requestAuth) return requestAuth.replace('Bearer ', '');

          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: WS_JWT_PAYLOAD): Promise<unknown> {
    try {
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        this.logger.warn(`User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`WS JWT validation successful for user: ${user.email}`);

      return {
        userId: String(user._id),
        email: user.email,
        name: user.name,
        color: user.color,
      };
    } catch (error) {
      this.logger.error(
        `JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
