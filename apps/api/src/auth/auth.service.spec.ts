import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let _prisma: PrismaService;
  let _jwtService: JwtService;
  let _redisService: RedisService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: { [key: string]: string } = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        BCRYPT_ROUNDS: '10',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _prisma = module.get<PrismaService>(PrismaService);
    _jwtService = module.get<JwtService>(JwtService);
    _redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        phone: registerDto.phone,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'CUSTOMER',
        passwordHash: hashedPassword,
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('id');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        phone: '+1234567890',
        password: 'Test@123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockPrismaService.user.findFirst.mockResolvedValue({ id: '1' });

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Test@123', 10),
        role: 'CUSTOMER',
        tenantId: null,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ identifier: 'test@example.com', password: 'Test@123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(user.email);
    });
  });
});
