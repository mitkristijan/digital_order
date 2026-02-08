import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { slugify } from '@digital-order/utils';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  OTPRequest,
  OTPVerifyRequest,
  UpdateProfileRequest,
  UserAuth,
} from '@digital-order/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterRequest): Promise<LoginResponse> {
    // Require either email or phone
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    // For email-only registration (e.g. admin dashboard), use placeholder for phone
    const phone = dto.phone || (dto.email ? `email-${dto.email}` : null);
    if (!phone) {
      throw new BadRequestException('Email or phone is required');
    }

    // Check if user already exists by phone
    const existingByPhone = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingByPhone) {
      throw new BadRequestException('User with this phone already exists');
    }

    // Check if user already exists by email
    if (dto.email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingByEmail) {
        throw new BadRequestException('User with this email already exists');
      }
    }

    // Password is required for registration
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      parseInt(process.env.BCRYPT_ROUNDS || '10')
    );

    // Create user (default CUSTOMER, allow TENANT_ADMIN for admin signup)
    const allowedRoles: string[] = ['CUSTOMER', 'TENANT_ADMIN'];
    const role = (dto.role && allowedRoles.includes(dto.role) ? dto.role : 'CUSTOMER') as
      | 'CUSTOMER'
      | 'TENANT_ADMIN';

    if (role === 'TENANT_ADMIN' && !dto.restaurantName?.trim()) {
      throw new BadRequestException('Restaurant name is required for admin registration');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
        phoneVerified: !!dto.phone,
        emailVerified: false,
      },
    });

    let tenantId: string | null = null;
    let subdomain: string | null = null;
    let menuSlug: string | null = null;

    if (role === 'TENANT_ADMIN') {
      const baseSubdomain = slugify(dto.restaurantName!.trim()) || 'restaurant';
      let subdomainCandidate = baseSubdomain;
      let suffix = 0;
      while (await this.prisma.tenant.findUnique({ where: { subdomain: subdomainCandidate } })) {
        subdomainCandidate = `${baseSubdomain}-${++suffix}`;
      }

      const tenant = await this.prisma.tenant.create({
        data: {
          name: dto.restaurantName!.trim(),
          subdomain: subdomainCandidate,
          ownerId: user.id,
          subscriptionTier: 'TRIAL',
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          settings: {
            theme: { primaryColor: '#4F46E5', logo: null, favicon: null },
            features: { tableOrdering: true, deliveryOrdering: false, takeawayOrdering: true, reservations: false, inventory: false, loyaltyProgram: false },
            limits: { maxMenuItems: 50, maxTables: 10, maxStaff: 5, maxOrders: 100 },
            business: { address: '', phone: '', email: dto.email || '', taxId: null, currency: 'USD', timezone: 'America/New_York' },
          },
        },
      });

      await this.prisma.tenantAccess.create({
        data: { userId: user.id, tenantId: tenant.id, role: 'TENANT_ADMIN' },
      });

      tenantId = tenant.id;
      subdomain = tenant.subdomain;
      menuSlug = tenant.menuSlug;
    }

    return this.generateTokens(user, tenantId, { subdomain, menuSlug });
  }

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const user = await this.validateUser(dto.identifier, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokensWithTenant(user);
  }

  async validateUser(identifier: string, password: string): Promise<any> {
    // Find user by email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async sendOTP(dto: OTPRequest): Promise<{ success: boolean }> {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          phoneVerified: false,
        },
      });
    }

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await this.prisma.oTPCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    // Also store in Redis for faster validation
    await this.redis.set(`otp:${dto.phone}`, code, 300); // 5 minutes TTL

    // TODO: Send SMS with code using Twilio or other SMS provider
    console.log(`📱 OTP for ${dto.phone}: ${code}`);

    return { success: true };
  }

  async verifyOTP(dto: OTPVerifyRequest): Promise<LoginResponse> {
    // Verify OTP
    const storedCode = await this.redis.get(`otp:${dto.phone}`);
    if (!storedCode || storedCode !== dto.code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Mark OTP as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    // Delete OTP
    await this.redis.del(`otp:${dto.phone}`);

    return this.generateTokensWithTenant(user);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return this.generateTokensWithTenant(storedToken.user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string, tenantId?: string | null, role?: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash, ...userWithoutPassword } = user;

    let subdomain: string | null = null;
    let menuSlug: string | null = null;
    let resolvedTenantId = tenantId;

    if (role === 'TENANT_ADMIN' || role === 'SUPER_ADMIN') {
      const access = await this.prisma.tenantAccess.findFirst({
        where: { userId },
        include: { tenant: true },
      });
      if (access) {
        resolvedTenantId = access.tenantId;
        subdomain = access.tenant.subdomain;
        menuSlug = access.tenant.menuSlug;
      }
    }

    return {
      ...userWithoutPassword,
      tenantId: resolvedTenantId ?? undefined,
      subdomain: subdomain ?? undefined,
      menuSlug: menuSlug ?? undefined,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileRequest): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate email uniqueness if changing
    if (dto.email !== undefined && dto.email !== user.email) {
      if (dto.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (existing && existing.id !== userId) {
          throw new BadRequestException('Email already in use');
        }
      }
    }

    // Validate phone uniqueness if changing
    if (dto.phone !== undefined && dto.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Phone already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Logout from all devices
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  private async generateTokensWithTenant(user: any): Promise<LoginResponse> {
    let tenantId: string | null = null;
    let subdomain: string | null = null;
    let menuSlug: string | null = null;

    if (user.role === 'TENANT_ADMIN') {
      const access = await this.prisma.tenantAccess.findFirst({
        where: { userId: user.id, role: 'TENANT_ADMIN' },
        include: { tenant: true },
      });
      if (access) {
        tenantId = access.tenantId;
        subdomain = access.tenant.subdomain;
        menuSlug = access.tenant.menuSlug;
      }
    } else if (user.role === 'SUPER_ADMIN') {
      const access = await this.prisma.tenantAccess.findFirst({
        where: { userId: user.id },
        include: { tenant: true },
      });
      if (access) {
        tenantId = access.tenantId;
        subdomain = access.tenant.subdomain;
        menuSlug = access.tenant.menuSlug;
      }
    }

    return this.generateTokens(user, tenantId, { subdomain, menuSlug });
  }

  private async generateTokens(
    user: any,
    tenantId: string | null,
    tenantInfo?: { subdomain: string | null; menuSlug: string | null }
  ): Promise<LoginResponse> {
    const payload: UserAuth = {
      userId: user.id,
      tenantId,
      role: user.role,
      permissions: [],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    const userResponse = {
      ...userWithoutPassword,
      tenantId: tenantId || undefined,
      subdomain: tenantInfo?.subdomain ?? undefined,
      menuSlug: tenantInfo?.menuSlug ?? undefined,
    };

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }
}
