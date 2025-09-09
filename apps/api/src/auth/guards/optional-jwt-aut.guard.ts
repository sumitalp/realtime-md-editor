// src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to make authentication optional
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Override handleRequest to not throw an error when no token is provided

  handleRequest(
    err: any,
    user: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _info: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
  ): any {
    // If there's no user and no error, just return null (no authentication)
    // If there's a user, return it
    // If there's an error, throw it
    if (err) {
      throw err;
    }
    return user || null;
  }
}
