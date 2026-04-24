import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FIFTEEN_MINUTES_IN_MILLISECONDS } from 'src/constants';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'node:crypto';

@Injectable()
export class MagicLinksService {
  constructor(private readonly prismaService: PrismaService) {}

  //create
  async createLink(user: User) {
    const raw = randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');

    await this.prismaService.magicLink.create({
      data: {
        body: hash,
        expiresAt: new Date(Date.now() + FIFTEEN_MINUTES_IN_MILLISECONDS),
        userId: user.id,
      },
    });

    return { linkData: raw };
  }

  //read
  async getLinkByHash(hash: string) {
    const magicLink = await this.prismaService.magicLink.findFirst({
      where: { body: hash },
    });

    if (!magicLink) throw new BadRequestException('No magic-link found');

    return magicLink;
  }

  //delete if invalidate also delete
  async deleteLinkById(id: number) {
    try {
      await this.prismaService.magicLink.delete({
        where: {
          id,
        },
      });

      return { status: 'success' };
    } catch {
      throw new BadRequestException('Failed to delete link');
    }
  }

  async deleteLinkByHash(hash: string) {
    try {
      await this.prismaService.magicLink.delete({
        where: {
          body: hash,
        },
      });

      return { status: 'success' };
    } catch {
      throw new BadRequestException('Failed to delete link');
    }
  }

  //todo: validation of link
  async validateLink(userLink: string) {
    const hashedUserLink = crypto
      .createHash('sha256')
      .update(userLink)
      .digest('hex');

    const magicLink = await this.prismaService.magicLink.findUnique({
      where: { body: hashedUserLink },
      include: { user: true },
    });

    if (!magicLink) throw new UnauthorizedException('Authentication Error');

    if (Date.now() >= magicLink.expiresAt.valueOf() || !magicLink.isValid) {
      throw new UnauthorizedException('Auth error');
    }

    await this.prismaService.magicLink.update({
      where: { id: magicLink.id },
      data: { isValid: false },
    });

    return magicLink;
  }

  //every 30 mins
  @Cron('0 */30 * * * *')
  async clearLinks() {
    await this.prismaService.magicLink.deleteMany({
      where: { OR: [{ isValid: false }, { expiresAt: { lt: new Date() } }] },
    });
    console.log('Cleared invalid links:', new Date().toLocaleString());
  }
}
