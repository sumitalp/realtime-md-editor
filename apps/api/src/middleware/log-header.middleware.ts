import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { log } from '@pnpmworkspace/logger';

@Injectable()
export class LogHeaderMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // // Full headers
    // log.info('Headers', req.headers);
    // Access request headers here
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader) log.info(`Authorization Header found.`);

    // Continue to the next middleware or route handler
    next();
  }
}
