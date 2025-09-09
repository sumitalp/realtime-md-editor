import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

import { log } from '@pnpmworkspace/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  try {
    app.useWebSocketAdapter(new IoAdapter(app));
  } catch (error) {
    console.error(`Websocket: ${error}`);
  }

  app.enableCors({
    // origin: [
    //   'http://localhost:3000', // Next.js development server
    //   'http://127.0.0.1:3000', // Alternative localhost format
    //   'http://192.168.0.193:3000',
    //   process.env.FRONTEND_URL || 'http://localhost:3000',
    // ],
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
    ],
    credentials: true, // Important for cookies/auth
    optionsSuccessStatus: 200, // For legacy browser support
  });
  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupGracefulShutdown({ app });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(log.error);
