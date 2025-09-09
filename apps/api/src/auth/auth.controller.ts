// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@Request() req: ExpressRequest & { user: { userId: string } }) {
    return this.authService.refreshToken(req.user.userId);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  verifyToken(@Request() req: ExpressRequest & { user: { userId: string } }) {
    console.log('Token verified for user:', req.user); // Backend debug log
    return req.user; // This returns { userId, email, name, color }
  }
}
