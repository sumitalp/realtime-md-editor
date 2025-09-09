import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // PUBLIC ENDPOINTS (no authentication required)

  @Get('public')
  async findPublicDocuments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findPublicDocuments({
      page: Number(page),
      limit: Number(limit),
      search,
    });
  }

  @Get('public/:id')
  async findPublicDocument(@Param('id') id: string) {
    return this.documentsService.findPublicDocument(id);
  }

  // AUTHENTICATED ENDPOINTS

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.create(createDocumentDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: ExpressRequest & { user?: { userId?: string } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.updateDocument(id, userId, updateDocumentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.deleteDocument(id, userId);
  }

  @Post(':id/collaborators')
  @UseGuards(JwtAuthGuard)
  addCollaboratorByEmail(
    @Param('id') id: string,
    @Body() data: { email: string; role?: 'viewer' | 'editor' },
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.addCollaboratorByEmail(
      id,
      userId,
      data.email,
      data.role || 'editor',
    );
  }

  @Delete(':id/collaborators/:collaboratorId')
  @UseGuards(JwtAuthGuard)
  removeCollaborator(
    @Param('id') id: string,
    @Param('collaboratorId') collaboratorId: string,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.documentsService.removeCollaborator(id, userId, collaboratorId);
  }
}
