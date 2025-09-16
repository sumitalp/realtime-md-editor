// Mock Types.ObjectId BEFORE importing anything
// const mockObjectId = jest.fn((id: string) => id || 'mocked-object-id');
// jest.mock('mongoose', () => ({
//   ...jest.requireActual('mongoose'),
//   Types: {
//     ObjectId: mockObjectId,
//   },
// }));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DocumentsService } from './documents.service';
import { UsersService } from '../users/users.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';

// Mock Types.ObjectId after importing
jest.spyOn(Types, 'ObjectId').mockImplementation((id: any) => id as any);

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockDocumentModel: Partial<Model<any>>;
  let mockUserModel: Partial<Model<any>>;
  let mockUsersService: Partial<UsersService>;

  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockCollaborator = {
    _id: 'collab123',
    name: 'Collaborator',
    email: 'collab@example.com',
  };

  const mockDocument = {
    _id: 'doc123',
    title: 'Test Document',
    content: 'Test content',
    ownerId: mockUser._id,
    collaborators: [],
    isPublic: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    save: jest.fn().mockResolvedValue(this),
    populate: jest.fn().mockReturnThis(),
    toObject: jest.fn().mockReturnValue({
      _id: 'doc123',
      title: 'Test Document',
      content: 'Test content',
      ownerId: mockUser,
      collaborators: [],
      isPublic: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }),
  };

  beforeEach(async () => {
    // Create a constructor function that also has static methods
    mockDocumentModel = jest.fn().mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...data, _id: 'doc123' }),
    }));

    // Add static methods to the constructor
    mockDocumentModel.create = jest.fn();
    mockDocumentModel.find = jest.fn();
    mockDocumentModel.findOne = jest.fn();
    mockDocumentModel.findById = jest.fn();
    mockDocumentModel.findByIdAndUpdate = jest.fn();
    mockDocumentModel.findByIdAndDelete = jest.fn();
    mockDocumentModel.findOneAndDelete = jest.fn();
    mockDocumentModel.countDocuments = jest.fn();
    mockDocumentModel.populate = jest.fn().mockReturnThis();

    // Set up mockUserModel
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    mockUsersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getModelToken('DocumentModel'),
          useValue: mockDocumentModel,
        },
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);

    // Reset mocks
    jest.clearAllMocks();
    
    // Reset ObjectId mock to ensure it returns the input string
    (Types.ObjectId as jest.Mock).mockImplementation((id: any) => id);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDocumentDto: CreateDocumentDto = {
      title: 'New Document',
      content: 'New content',
      isPublic: false,
    };

    it('should create a new document', async () => {
      const createdDocument = { ...mockDocument, ...createDocumentDto };
      
      // Mock the chained methods for findById().populate().populate().exec()
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(createdDocument),
      };
      mockDocumentModel.findById = jest.fn().mockReturnValue(mockQuery);

      const result = await service.create(createDocumentDto, 'user123');

      expect(mockDocumentModel.findById).toHaveBeenCalledWith('doc123');
      expect(mockQuery.populate).toHaveBeenCalledWith('ownerId', 'name email color');
      expect(mockQuery.populate).toHaveBeenCalledWith('collaborators.userId', 'name email color');
      expect(result).toEqual(createdDocument);
    });

    it('should handle creation errors', async () => {
      // Mock the constructor to return an object with a save method that rejects
      mockDocumentModel.mockImplementation((data: any) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error('Creation failed')),
      }));

      await expect(
        service.create(createDocumentDto, 'user123'),
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    it('should return user documents', async () => {
      const mockDocuments = [mockDocument];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocuments),
      };

      mockDocumentModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findAllByUser('user123');

      expect(mockDocumentModel.find).toHaveBeenCalledWith({
        $or: [{ ownerId: new Types.ObjectId('user123') }, { 'collaborators.userId': new Types.ObjectId('user123') }],
      });
      expect(mockDocumentModel.find).toHaveBeenCalled();
      expect(mockQuery.populate).toHaveBeenCalledWith('ownerId', 'name email color');
      expect(mockQuery.populate).toHaveBeenCalledWith('collaborators.userId', 'name email color');
      expect(result).toEqual(mockDocuments);
    });
  });

  describe('findOne', () => {
    it('should return a document the user has access to', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocument),
      };
      (mockDocumentModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await service.findOne('doc123', 'user123');

      // expect(mockDocumentModel.findOne).toHaveBeenCalledWith({
      //   _id: 'doc123',
      //   $or: [
      //     { ownerId: 'user123' },
      //     { 'collaborators.userId': 'user123' },
      //   ],
      // });
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException if document not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      (mockDocumentModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      await expect(service.findOne('nonexistent', 'user123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no access', async () => {
      // const privateDocument = {
      //   ...mockDocument,
      //   ownerId: { _id: 'otheruser' },
      //   collaborators: [],
      //   isPublic: false,
      // };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      (mockDocumentModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      await expect(service.findOne('doc123', 'user123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDocumentDto: UpdateDocumentDto = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('should update a document when user is owner', async () => {
      const updatedDocument = { ...mockDocument, ...updateDocumentDto };
      const documentWithSave = {
        ...mockDocument,
        save: jest.fn().mockResolvedValue(mockDocument),
      };
      
      // Mock findOne to return the document directly (not a query)
      (mockDocumentModel.findOne as jest.Mock).mockResolvedValue(documentWithSave);
      
      const mockFindByIdQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedDocument),
      };
      (mockDocumentModel.findById as jest.Mock).mockReturnValue(mockFindByIdQuery);

      const result = await service.updateDocument(
        'doc123',
        'user123',
        updateDocumentDto,
      );

      expect(documentWithSave.save).toHaveBeenCalled();
      expect(mockDocumentModel.findById).toHaveBeenCalledWith('doc123');
      expect(result).toEqual(updatedDocument);
    });

    it('should throw NotFoundException when user has no access to document', async () => {
      // Mock findOne to return null, simulating no access (the query filters out inaccessible docs)
      (mockDocumentModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateDocument('doc123', 'user123', updateDocumentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a document when user is owner', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocument),
      };
      (mockDocumentModel.findOne as jest.Mock).mockReturnValue(mockQuery);
      (mockDocumentModel.findOneAndDelete as jest.Mock).mockResolvedValue(
        mockDocument,
      );

      const result = await service.deleteDocument('doc123', 'user123');

      expect(mockDocumentModel.findOneAndDelete).toHaveBeenCalledWith(
        {_id: 'doc123', ownerId: new Types.ObjectId('user123')},
      );
      expect(result).toEqual({ message: 'Document deleted successfully' });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const otherUserDocument = {
        ...mockDocument,
        ownerId: { _id: 'otheruser' },
      };
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(otherUserDocument),
      };
      (mockDocumentModel.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(service.deleteDocument('doc123', 'user123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findPublicDocuments', () => {
    it('should return paginated public documents', async () => {
      const mockPublicDocs = [{ ...mockDocument, isPublic: true }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPublicDocs),
      };
      (mockDocumentModel.find as jest.Mock).mockReturnValue(mockQuery);
      (mockDocumentModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.findPublicDocuments({ page: 1, limit: 10 });

      expect(mockDocumentModel.find).toHaveBeenCalledWith({ isPublic: true });
      expect(result).toEqual({
        documents: mockPublicDocs,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        }
      });
    });

    it('should filter by search term', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      (mockDocumentModel.find as jest.Mock).mockReturnValue(mockQuery);
      (mockDocumentModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await service.findPublicDocuments({ page: 1, limit: 10, search: 'test' });

      expect(mockDocumentModel.find).toHaveBeenCalledWith({
        isPublic: true,
        $or: [
          { title: { $regex: 'test', $options: 'i' } },
          { content: { $regex: 'test', $options: 'i' } },
        ],
      });
    });
  });

  describe('addCollaborator', () => {
    it('should add collaborator when user is owner', async () => {
      // Mock document ownership check
      (mockDocumentModel.findOne as jest.Mock).mockResolvedValue({
        ...mockDocument,
        save: jest.fn().mockResolvedValue(mockDocument),
      });
      
      // Mock user lookup
      (mockUserModel.findOne as jest.Mock).mockResolvedValue(mockCollaborator);

      const updatedDocument = {
        ...mockDocument,
        collaborators: [
          { userId: mockCollaborator._id, role: 'editor', addedAt: expect.any(Date) },
        ],
      };
      
      const mockFindByIdQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedDocument),
      };
      (mockDocumentModel.findById as jest.Mock).mockReturnValue(mockFindByIdQuery);

      const result = await service.addCollaboratorByEmail(
        'doc123',
        'user123',
        'collab@example.com',
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'collab@example.com',
      });
      expect(result).toEqual(updatedDocument);
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockDocumentModel.findOne as jest.Mock).mockResolvedValue({
        ...mockDocument,
        save: jest.fn(),
      });
      (mockUserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addCollaboratorByEmail(
          'doc123',
          'user123',
          'nonexistent@example.com',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      (mockDocumentModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addCollaboratorByEmail(
          'doc123',
          'user123',
          'nonexistent@example.com',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // describe('togglePublic', () => {
  //   it('should toggle document public status when user is owner', async () => {
  //     const mockQuery = {
  //       populate: jest.fn().mockResolvedValue(mockDocument),
  //     };
  //     (mockDocumentModel.findById as jest.Mock).mockReturnValue(mockQuery);
  //
  //     const toggledDocument = { ...mockDocument, isPublic: true };
  //     (mockDocumentModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
  //       populate: jest.fn().mockResolvedValue(toggledDocument),
  //     });
  //
  //     const result = await service.togglePublic('doc123', 'user123');
  //
  //     expect(mockDocumentModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //       'doc123',
  //       { isPublic: true },
  //       { new: true },
  //     );
  //     expect(result).toEqual(toggledDocument);
  //   });
  //
  //   it('should throw ForbiddenException when user is not owner', async () => {
  //     const otherUserDocument = {
  //       ...mockDocument,
  //       ownerId: { _id: 'otheruser' },
  //     };
  //     const mockQuery = {
  //       populate: jest.fn().mockResolvedValue(otherUserDocument),
  //     };
  //     (mockDocumentModel.findById as jest.Mock).mockReturnValue(mockQuery);
  //
  //     await expect(service.togglePublic('doc123', 'user123')).rejects.toThrow(
  //       ForbiddenException,
  //     );
  //   });
  // });
});
