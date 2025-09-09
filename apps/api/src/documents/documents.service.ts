// src/documents/documents.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DocumentModel,
  DocumentDocument,
  Role,
} from '../schemas/document.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';

interface PublicDocumentQuery {
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // PUBLIC METHODS (no authentication required)

  async findPublicDocuments(query: PublicDocumentQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Find public documents
    const filter = {
      isPublic: true,
      ...searchFilter,
    };

    const [documents, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .populate('ownerId', 'name email color')
        .populate('collaborators.userId', 'name email color')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel.countDocuments(filter),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicDocument(id: string) {
    const document = await this.documentModel
      .findOne({ _id: id, isPublic: true })
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .exec();

    if (!document) {
      throw new NotFoundException('Public document not found');
    }

    return document;
  }

  // AUTHENTICATED METHODS (existing methods with modifications)

  async create(createDocumentDto: CreateDocumentDto, userId: string) {
    const document = new this.documentModel({
      ...createDocumentDto,
      ownerId: new Types.ObjectId(userId),
      isPublic: createDocumentDto.isPublic || false, // Add isPublic field
    });

    const savedDocument = await document.save();

    return this.documentModel
      .findById(savedDocument._id)
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .exec();
  }

  async findAllByUser(userId: string) {
    return this.documentModel
      .find({
        $or: [
          { ownerId: new Types.ObjectId(userId) },
          {
            'collaborators.userId': new Types.ObjectId(userId),
          },
        ],
      })
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string) {
    const document = await this.documentModel
      .findOne({
        _id: id,
        $or: [
          { ownerId: new Types.ObjectId(userId) },
          {
            'collaborators.userId': new Types.ObjectId(userId),
          },
        ],
      })
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .exec();

    if (!document) {
      throw new NotFoundException('Document not found or access denied');
    }

    return document;
  }

  async updateDocument(
    id: string,
    userId: string,
    updateDocumentDto: UpdateDocumentDto,
  ) {
    const document = await this.documentModel.findOne({
      _id: id,
      $or: [
        { ownerId: new Types.ObjectId(userId) },
        {
          collaborators: {
            $elemMatch: {
              userId: new Types.ObjectId(userId),
              role: { $in: [Role.EDITOR, Role.OWNER] },
            },
          },
        },
      ],
    });

    if (!document) {
      throw new NotFoundException('Document not found or access denied');
    }

    Object.assign(document, updateDocumentDto);
    await document.save();

    return this.documentModel
      .findById(id)
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .exec();
  }

  async deleteDocument(id: string, userId: string) {
    const result = await this.documentModel.findOneAndDelete({
      _id: id,
      ownerId: new Types.ObjectId(userId),
    });

    if (!result) {
      throw new ForbiddenException('You can only delete documents you own');
    }

    return { message: 'Document deleted successfully' };
  }

  async addCollaboratorByEmail(
    documentId: string,
    ownerUserId: string,
    collaboratorEmail: string,
    role: 'viewer' | 'editor' = 'editor',
  ): Promise<DocumentDocument> {
    // Verify document ownership
    const document = await this.documentModel.findOne({
      _id: documentId,
      ownerId: new Types.ObjectId(ownerUserId),
    });

    if (!document) {
      throw new ForbiddenException(
        'You can only add collaborators to documents you own',
      );
    }

    // Find collaborator user by email
    const collaborator = await this.userModel.findOne({
      email: collaboratorEmail,
    });

    if (!collaborator) {
      throw new NotFoundException('User not found with that email address');
    }

    // Check if user is already a collaborator
    const existingCollaborator = document.collaborators.find(
      (c) =>
        c.userId.toString() === (collaborator._id as Types.ObjectId).toString(),
    );

    if (existingCollaborator) {
      throw new ConflictException(
        'User is already a collaborator on this document',
      );
    }

    // Check if user is the owner
    if (
      document.ownerId.toString() ===
      (collaborator._id as Types.ObjectId).toString()
    ) {
      throw new ConflictException('Cannot add document owner as collaborator');
    }

    // Add collaborator
    document.collaborators.push({
      userId: collaborator._id as Types.ObjectId,
      role: role as Role,
      addedAt: new Date(),
    });

    await document.save();

    const updatedDocument = await this.documentModel
      .findById(documentId)
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .exec();

    if (!updatedDocument) {
      throw new NotFoundException('Document not found after update');
    }

    return updatedDocument;
  }

  async removeCollaborator(
    documentId: string,
    ownerUserId: string,
    collaboratorUserId: string,
  ): Promise<DocumentDocument> {
    const document = await this.documentModel.findOne({
      _id: documentId,
      ownerId: new Types.ObjectId(ownerUserId),
    });

    if (!document) {
      throw new ForbiddenException(
        'You can only remove collaborators from documents you own',
      );
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.userId.toString() !== collaboratorUserId,
    );

    await document.save();

    const updatedDocument = await this.documentModel
      .findById(documentId)
      .populate('ownerId', 'name email color')
      .populate('collaborators.userId', 'name email color')
      .exec();

    if (!updatedDocument) {
      throw new NotFoundException('Document not found after update');
    }

    return updatedDocument;
  }
}
