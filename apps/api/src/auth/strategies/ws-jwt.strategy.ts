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
        (req: JwtRequestPayload) => {
          return (
            req.handshake.auth?.token ||
            req.handshake.headers?.authorization?.replace('Bearer ', '') ||
            req.request.headers?.authorization?.replace('Bearer ', '')
          );
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: WS_JWT_PAYLOAD) {
    try {
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        this.logger.warn(`User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`WS JWT validation successful for user: ${user.email}`);

      return {
        userId: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        color: user.color,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
