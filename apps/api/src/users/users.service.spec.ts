import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { randEmail, randFullName } from '@ngneat/falso';

jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockUser = {
    _id: 'user123',
    name: randFullName(),
    email: randEmail(),
    password: 'hashedpassword',
    save: jest.fn().mockResolvedValue({
      _id: 'user123',
      name: randFullName(),
      email: randEmail(),
      password: 'hashedpassword',
    }),
  };

  beforeEach(async () => {
    // Create a constructor function that also has static methods
    mockUserModel = jest.fn().mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...data, _id: 'user123' }),
    }));

    // Add static methods to the constructor
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();
    mockUserModel.findByIdAndUpdate = jest.fn();
    mockUserModel.findByIdAndDelete = jest.fn();
    mockUserModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: randFullName(),
        email: randEmail(),
        password: 'password123',
      };

      (mockUserModel.findOne as jest.Mock).mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);

      const result = await service.create(createUserDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      await expect(result).toBeDefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: randFullName(),
        email: randEmail(),
        password: 'password123',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const selectMock = {
        exec: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue(selectMock),
      });

      const result = await service.findOne('user123');

      expect(mockUserModel.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const selectMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue(selectMock),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail('test@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      const selectMock = {
        exec: jest.fn().mockResolvedValue(updatedUser),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue(selectMock),
      });

      const result = await service.update('user123', updateUserDto);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        updateUserDto,
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const selectMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue(selectMock),
      });

      await expect(
        service.update('nonexistent', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await service.remove('user123');

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
