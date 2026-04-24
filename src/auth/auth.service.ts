import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  REFRESH_TOKEN_EXPIRATION,
  THIRTY_DAYS_IN_MILLISECONDS,
} from 'src/constants';
import { EmailService } from 'src/email/email.service';
import { MagicLinksService } from 'src/magic-links/magic-links.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'jwt-decode';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly magicLinksService: MagicLinksService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (user) {
      const { linkData } = await this.magicLinksService.createLink(user);
      await this.emailService.sendEmail(
        user.email,
        'Test',
        `Hello bro follow <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/candidate/auth/callback/${linkData}">this link</a> to access the app.`,
      );
      return { message: 'Sent confirmation if this email exists' };
      //user does GET request to there, server extracts magic, verifies, if valid -> issues new access via passport, redirect to fe localhost:3000/candidates/me, if not valid redirect to fe localhost:3000/candidates/auth/login
      //user has his acceess_token via http-only-cookie and can access the data
    }
    return { message: 'Sent confirmation if this email exists' };
  }

  async register(email: string) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw new BadRequestException('User with such email already exists');

    const userRole = await this.prismaService.userRole.findFirst({
      where: { userRole: 'candidate' },
    });

    if (!userRole) throw new BadRequestException('Error registering user');

    const newUser = await this.prismaService.user.create({
      data: {
        email,
        fullName: '',
        role: '',
        userRoleId: userRole.id,
      },
    });

    const { linkData } = await this.magicLinksService.createLink(newUser);
    await this.emailService.sendEmail(
      email,
      'Authentication Link',
      `Hello bro follow <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/candidate/auth/callback/${linkData}">this link</a> to access the app.`,
    );

    return { status: 'success' };
  }

  async verifyLink(
    link: string,
  ): Promise<{ access_token: string; refresh_token: string; status: string }> {
    const magicLink = await this.magicLinksService.validateLink(link);

    const { access_token, refresh_token } = await this.generateTokens({
      sub: magicLink.user.id,
      email: magicLink.user.email,
    });

    return { access_token, refresh_token, status: 'success' };
  }

  async generateTokens(payload: { sub: number; email: string }) {
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET_REFRESH,
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    await this.saveRefreshToken(refresh_token, payload.sub);

    return { access_token, refresh_token };
  }

  async saveRefreshToken(token: string, userId: number) {
    const hashedRefreshToken = await bcrypt.hash(
      token,
      Number(process.env.SALT_ROUNDS),
    );

    if (!hashedRefreshToken) throw new BadRequestException('Fail during auth');

    const expiresAt = new Date(
      new Date().getTime() + THIRTY_DAYS_IN_MILLISECONDS,
    );

    const createdToken = await this.prismaService.hashedToken.create({
      data: {
        hash: hashedRefreshToken,
        userId,
        expiresAt: expiresAt,
      },
    });

    return createdToken;
  }

  async verifyRefresh(refreshToken: string) {
    const isValid = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET_REFRESH,
    });

    if (!isValid) throw new UnauthorizedException('Unauthorized');

    const payload: JwtPayload = await this.jwtService.decode(refreshToken);

    if (!payload.sub) throw new UnauthorizedException('No userId in jwt sub');

    const dbTokens = await this.prismaService.hashedToken.findMany({
      where: { user: { id: Number(payload.sub) } },
      include: { user: true },
    });

    if (!dbTokens) throw new UnauthorizedException('Unauthorized');

    for (const dbToken of dbTokens) {
      const sameToken = await bcrypt.compare(refreshToken, dbToken.hash);
      if (sameToken) {
        return this.generateTokens({
          sub: dbToken.user.id,
          email: dbToken.user.email,
        });
      }
    }
    //triggers
    throw new UnauthorizedException('Unauthorized');
  }

  //every 30 mins
  @Cron('0 */30 * * * *')
  async clearTokens() {
    await this.prismaService.hashedToken.deleteMany({
      where: { OR: [{ isValid: false }, { expiresAt: { lt: new Date() } }] },
    });
    console.log('Cleared invalid ref tokens:', new Date().toLocaleString());
  }
}
