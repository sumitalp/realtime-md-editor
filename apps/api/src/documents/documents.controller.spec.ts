import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import * as requestTypes from '../types/requests.types';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let mockDocumentsService: Partial<DocumentsService>;

  interface MockUser {
    userId: string;
    email: string;
    name: string;
  }

  const mockUser: MockUser = {
    userId: 'user123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockDocument = {
    _id: 'doc123',
    title: 'Test Document',
    content: 'Test content',
    ownerId: {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
    },
    collaborators: [],
    isPublic: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    mockDocumentsService = {
      findPublicDocuments: jest.fn(),
      findPublicDocument: jest.fn(),
      create: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
      addCollaboratorByEmail: jest.fn(),
      removeCollaborator: jest.fn(),
      // togglePublic: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Public Endpoints', () => {
    describe('findPublicDocuments', () => {
      it('should return paginated public documents', async () => {
        const expectedResult = {
          documents: [{ ...mockDocument, isPublic: true }],
          total: 1,
          page: 1,
          limit: 10,
        };

        (
          mockDocumentsService.findPublicDocuments as jest.Mock
        ).mockResolvedValue(expectedResult);

        const result = await controller.findPublicDocuments(1, 10);

        expect(mockDocumentsService.findPublicDocuments).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          search: undefined,
        });
        expect(result).toEqual(expectedResult);
      });

      it('should handle search parameter', async () => {
        const expectedResult = {
          documents: [],
          total: 0,
          page: 1,
          limit: 10,
        };

        (
          mockDocumentsService.findPublicDocuments as jest.Mock
        ).mockResolvedValue(expectedResult);

        await controller.findPublicDocuments(1, 10, 'search term');

        expect(mockDocumentsService.findPublicDocuments).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          search: 'search term',
        });
      });
    });

    describe('findPublicDocument', () => {
      it('should return a public document by id', async () => {
        const publicDocument = { ...mockDocument, isPublic: true };
        (
          mockDocumentsService.findPublicDocument as jest.Mock
        ).mockResolvedValue(publicDocument);

        const result = await controller.findPublicDocument('doc123');

        expect(mockDocumentsService.findPublicDocument).toHaveBeenCalledWith(
          'doc123',
        );
        expect(result).toEqual(publicDocument);
      });

      it('should throw NotFoundException for non-existent document', async () => {
        (
          mockDocumentsService.findPublicDocument as jest.Mock
        ).mockRejectedValue(new NotFoundException('Document not found'));

        await expect(
          controller.findPublicDocument('nonexistent'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Authenticated Endpoints', () => {
    const mockRequest: requestTypes.RequestWithUser = { user: mockUser };

    describe('create', () => {
      const createDocumentDto: CreateDocumentDto = {
        title: 'New Document',
        content: 'New content',
        isPublic: false,
      };

      it('should create a new document', async () => {
        const createdDocument = { ...mockDocument, ...createDocumentDto };
        (mockDocumentsService.create as jest.Mock).mockResolvedValue(
          createdDocument,
        );

        const result = await controller.create(createDocumentDto, mockRequest);

        expect(mockDocumentsService.create).toHaveBeenCalledWith(
          createDocumentDto,
          mockUser.userId,
        );
        expect(result).toEqual(createdDocument);
      });

      it('should handle creation errors', async () => {
        (mockDocumentsService.create as jest.Mock).mockRejectedValue(
          new Error('Creation failed'),
        );

        await expect(
          controller.create(createDocumentDto, mockRequest),
        ).rejects.toThrow('Creation failed');
      });
    });

    describe('findAll', () => {
      it('should return all user documents', async () => {
        const userDocuments = [mockDocument];
        (mockDocumentsService.findAllByUser as jest.Mock).mockResolvedValue(
          userDocuments,
        );

        const result = await controller.findAll(mockRequest);

        expect(mockDocumentsService.findAllByUser).toHaveBeenCalledWith(
          mockUser.userId,
        );
        expect(result).toEqual(userDocuments);
      });
    });

    describe('findOne', () => {
      it('should return a specific document', async () => {
        (mockDocumentsService.findOne as jest.Mock).mockResolvedValue(
          mockDocument,
        );

        const result = await controller.findOne('doc123', mockRequest);

        expect(mockDocumentsService.findOne).toHaveBeenCalledWith(
          'doc123',
          mockUser.userId,
        );
        expect(result).toEqual(mockDocument);
      });

      it('should throw NotFoundException for non-existent document', async () => {
        (mockDocumentsService.findOne as jest.Mock).mockRejectedValue(
          new NotFoundException('Document not found'),
        );

        await expect(
          controller.findOne('nonexistent', mockRequest),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException for unauthorized access', async () => {
        (mockDocumentsService.findOne as jest.Mock).mockRejectedValue(
          new ForbiddenException('Access denied'),
        );

        await expect(controller.findOne('doc123', mockRequest)).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('update', () => {
      const updateDocumentDto: UpdateDocumentDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      it('should update a document', async () => {
        const updatedDocument = { ...mockDocument, ...updateDocumentDto };
        (mockDocumentsService.updateDocument as jest.Mock).mockResolvedValue(
          updatedDocument,
        );

        const result = await controller.update(
          'doc123',
          updateDocumentDto,
          mockRequest,
        );

        expect(mockDocumentsService.updateDocument).toHaveBeenCalledWith(
          'doc123',
          mockUser.userId,
          updateDocumentDto,
        );
        expect(result).toEqual(updatedDocument);
      });

      it('should throw ForbiddenException when user not authorized', async () => {
        (mockDocumentsService.updateDocument as jest.Mock).mockRejectedValue(
          new ForbiddenException('Not authorized to update this document'),
        );

        await expect(
          controller.update('doc123', updateDocumentDto, mockRequest),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('remove', () => {
      it('should delete a document', async () => {
        (mockDocumentsService.deleteDocument as jest.Mock).mockResolvedValue({
          message: 'Document deleted successfully',
        });

        const result = await controller.remove('doc123', mockRequest);

        expect(mockDocumentsService.deleteDocument).toHaveBeenCalledWith(
          'doc123',
          mockUser.userId,
        );
        expect(result).toEqual({ message: 'Document deleted successfully' });
      });

      it('should throw ForbiddenException when user not authorized', async () => {
        (mockDocumentsService.deleteDocument as jest.Mock).mockRejectedValue(
          new ForbiddenException('Not authorized to delete this document'),
        );

        await expect(controller.remove('doc123', mockRequest)).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('addCollaborator', () => {
      const addCollaboratorDto = { email: 'collaborator@example.com' };

      it('should add a collaborator', async () => {
        const updatedDocument = {
          ...mockDocument,
          collaborators: [
            { userId: 'collab123', role: 'editor', addedAt: new Date() },
          ],
        };
        (
          mockDocumentsService.addCollaboratorByEmail as jest.Mock
        ).mockResolvedValue(updatedDocument);

        const result = await controller.addCollaboratorByEmail(
          'doc123',
          addCollaboratorDto,
          mockRequest,
        );

        expect(
          mockDocumentsService.addCollaboratorByEmail,
        ).toHaveBeenCalledWith(
          'doc123',
          mockUser.userId,
          addCollaboratorDto.email,
          'editor',
        );
        expect(result).toEqual(updatedDocument);
      });

      it('should throw ForbiddenException when user not owner', async () => {
        (
          mockDocumentsService.addCollaboratorByEmail as jest.Mock
        ).mockRejectedValue(
          new ForbiddenException('Only document owner can add collaborators'),
        );

        await expect(
          controller.addCollaboratorByEmail(
            'doc123',
            addCollaboratorDto,
            mockRequest,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('removeCollaborator', () => {
      it('should remove a collaborator', async () => {
        (
          mockDocumentsService.removeCollaborator as jest.Mock
        ).mockResolvedValue(mockDocument);

        const result = await controller.removeCollaborator(
          'doc123',
          'collab123',
          mockRequest,
        );

        expect(mockDocumentsService.removeCollaborator).toHaveBeenCalledWith(
          'doc123',
          mockUser.userId,
          'collab123',
        );
        expect(result).toEqual(mockDocument);
      });

      it('should throw ForbiddenException when user not owner', async () => {
        (
          mockDocumentsService.removeCollaborator as jest.Mock
        ).mockRejectedValue(
          new ForbiddenException(
            'Only document owner can remove collaborators',
          ),
        );

        await expect(
          controller.removeCollaborator('doc123', 'collab123', mockRequest),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    // describe('togglePublic', () => {
    //   it('should toggle document visibility', async () => {
    //     const toggledDocument = { ...mockDocument, isPublic: true };
    //     (mockDocumentsService.togglePublic as jest.Mock).mockResolvedValue(
    //       toggledDocument,
    //     );
    //
    //     const result = await controller.togglePublic('doc123', mockRequest);
    //
    //     expect(mockDocumentsService.togglePublic).toHaveBeenCalledWith(
    //       'doc123',
    //       mockUser.userId,
    //     );
    //     expect(result).toEqual(toggledDocument);
    //   });
    //
    //   it('should throw ForbiddenException when user not owner', async () => {
    //     (mockDocumentsService.togglePublic as jest.Mock).mockRejectedValue(
    //       new ForbiddenException('Only document owner can change visibility'),
    //     );
    //
    //     await expect(
    //       controller.togglePublic('doc123', mockRequest),
    //     ).rejects.toThrow(ForbiddenException);
    //   });
    // });
  });
});
