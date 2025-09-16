import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { randEmail, randFullName } from '@ngneat/falso';

import * as requestTypes from '../types/requests.types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let mockUsersService: Partial<UsersService>;

  const mockUser = {
    _id: 'user123',
    name: randFullName(),
    email: randEmail(),
  };

  const mockUserData = {
    ...mockUser,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      searchUsers: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: randFullName(),
        email: randEmail(),
        password: 'password123',
      };
      
      const createdUser = {
        ...mockUserData,
        name: createUserDto.name,
        email: createUserDto.email,
      };
      (mockUsersService.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUserData];
      (mockUsersService.findAll as jest.Mock).mockResolvedValue(users);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a specific user', async () => {
      (mockUsersService.findOne as jest.Mock).mockResolvedValue(mockUserData);

      const result = await controller.findOne(mockUser._id);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUserData);
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
    let mockRequest: RequestWithUser;
      mockRequest = {
        user: {
          userId: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          color: '',
        },
      };
      (mockUsersService.findOne as jest.Mock).mockResolvedValue(mockUserData);

      const result = await controller.getProfile(mockRequest);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUserData);
    });

    it('should throw UnauthorizedException if user not authenticated', async () => {
      const mockRequest = {
        user: {
          userId: undefined,
          name: undefined,
          email: undefined,
          color: undefined,
        },
      } as RequestWithUser;

      expect(() => controller.getProfile(mockRequest)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should update user profile', async () => {
      const mockRequest: requestTypes.RequestWithUser = {
        user: {
          userId: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          color: '',
        },
      };
      const updatedUser = { ...mockUserData, name: 'Updated Name' };
      (mockUsersService.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser._id,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw UnauthorizedException if user not authenticated', async () => {
      const mockRequest = { user: undefined } as requestTypes.RequestWithUser;

      await expect(() => controller.updateProfile(mockRequest, updateUserDto)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should update user by id', async () => {
      const updatedUser = { ...mockUserData, name: 'Updated Name' };
      (mockUsersService.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser._id, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser._id,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete user account', async () => {
      (mockUsersService.remove as jest.Mock).mockResolvedValue({
        message: 'User deleted successfully',
      });

      const result = await controller.remove(mockUser._id);

      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });
  });

  describe('search', () => {
    it('should search for users', async () => {
      const users = [mockUserData];
      (mockUsersService.searchUsers as jest.Mock).mockResolvedValue(users);

      const result = await controller.search('test');

      expect(mockUsersService.searchUsers).toHaveBeenCalledWith('test');
      expect(result).toEqual(users);
    });
  });
});
