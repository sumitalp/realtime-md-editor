import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'; // Add this
import { ConfigModule, ConfigService } from '@nestjs/config'; // Add this
import { CollaborationGateway } from './collaboration.gateway';
import { DocumentModel, DocumentSchema } from '../schemas/document.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: DocumentModel.name, schema: DocumentSchema },
    ]),
    // Add JwtModule for token verification in WebSocket
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CollaborationGateway],
})
export class CollaborationModule {}
