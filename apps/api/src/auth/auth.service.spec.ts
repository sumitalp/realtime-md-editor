import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';

jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;

  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    color: '#FF5733',
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      (mockUsersService.create as jest.Mock).mockResolvedValue(mockUser);
      (mockJwtService.sign as jest.Mock).mockReturnValue('jwt_token');

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        name: mockUser.name,
      });
      expect(result.access_token).toBe('jwt_token');
      expect(result.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      (mockUsersService.create as jest.Mock).mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should handle user creation errors', async () => {
      (mockUsersService.create as jest.Mock).mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      (mockJwtService.sign as jest.Mock).mockReturnValue('jwt_token');

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        name: mockUser.name,
      });
      expect(result.access_token).toBe('jwt_token');
      expect(result.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt comparison errors', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockRejectedValue(
        new Error('Comparison failed') as never,
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        'Comparison failed',
      );
    });
  });

  describe('validateUserByEmailPass', () => {
    it('should return user data if credentials are valid', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compareSync.mockReturnValue(true as never);

      const result = await service.validateUserByEmailPass(
        mockUser.email,
        mockUser.password,
      );

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.validateUserByEmailPass(
        'test@example.com',
        'password123',
      )).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compareSync.mockReturnValue(false as never);

      await expect(service.validateUserByEmailPass(
        'test@example.com',
        'password123',
      )).rejects.toThrow(UnauthorizedException);
    });
  });
});
