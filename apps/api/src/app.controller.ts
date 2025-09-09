import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { Request as ExpressRequest } from 'express';
import type { HelloResponse, HealthResponse } from './types/response.types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): HelloResponse {
    return {
      message: this.appService.getHello(),
      timestamp: new Date().toISOString(),
      endpoints: {
        health: 'GET /health',
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        verify: 'GET /auth/verify (requires JWT)',
        documents: 'GET /documents (requires JWT)',
        publicDocs: 'GET /documents/public',
      },
    };
  }

  @Get('health')
  healthCheck(): HealthResponse {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Backend is healthy',
      port: process.env.PORT ?? 3001,
    };
  }

  // Test endpoint without auth
  @Get('test-no-auth')
  testNoAuth(): Pick<HealthResponse, 'timestamp' | 'message'> {
    return {
      message: 'This endpoint works without authentication',
      timestamp: new Date().toISOString(),
    };
  }

  // Test endpoint with auth
  @Get('test-with-auth')
  @UseGuards(JwtAuthGuard)
  testWithAuth(@Request() req: ExpressRequest & { user: { userId: string } }) {
    return {
      message: 'This endpoint requires authentication and it works!',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
}
