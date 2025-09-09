// src/app.module.ts
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { LogHeaderMiddleware } from './middleware/log-header.middleware';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documenrs.module';
import { CollaborationModule } from './collaboration/collaboration.module';

@Module({
  imports: [
    GracefulShutdownModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb://localhost:27017/collaborative-editor',
    ),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    DocumentsModule,
    CollaborationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply your custom middleware BEFORE CORS is implicitly handled by app.enableCors()
    consumer
      .apply(LogHeaderMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes and methods
  }
}
