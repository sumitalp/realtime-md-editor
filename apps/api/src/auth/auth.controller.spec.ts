import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto';
import { LoginDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateUserByEmailPass: jest.fn(),
    };

    mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
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

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a user', async () => {
      const expectedResult = {
        message: 'User created successfully',
        user: {
          _id: 'user_id',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (mockAuthService.register as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException if user already exists', async () => {
      const error = new ConflictException('User already exists');
      (mockAuthService.register as jest.Mock).mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw BadRequestException for invalid data', async () => {
      const invalidRegisterDto = {
        name: '',
        email: 'invalid-email',
        password: '123', // too short
      };

      const error = new BadRequestException('Invalid registration data');
      (mockAuthService.register as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.register(invalidRegisterDto as RegisterDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const expectedResult = {
        access_token: 'jwt_token_here',
        user: {
          _id: 'user_id',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (mockAuthService.login as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for invalid credentials', async () => {
      const error = new BadRequestException('Invalid credentials');
      (mockAuthService.login as jest.Mock).mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle non-existent user', async () => {
      const error = new BadRequestException('User not found');
      (mockAuthService.login as jest.Mock).mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle wrong password', async () => {
      const wrongPasswordDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new BadRequestException('Invalid password');
      (mockAuthService.login as jest.Mock).mockRejectedValue(error);

      await expect(controller.login(wrongPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // describe('profile', () => {
  //   it('should return user profile when authenticated', async () => {
  //     const mockUser = {
  //       _id: 'user_id',
  //       name: 'Test User',
  //       email: 'test@example.com',
  //     };
  //
  //     const mockRequest = {
  //       user: mockUser,
  //     };
  //
  //     // Note: This assumes there's a profile endpoint - adjust based on actual implementation
  //     if (controller.getProfile) {
  //       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  //       // @ts-ignore
  //       const result = await controller.getProfile(mockRequest);
  //       expect(result).toEqual(mockUser);
  //     }
  //   });
  // });
});
