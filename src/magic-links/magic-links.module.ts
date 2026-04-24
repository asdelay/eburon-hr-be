import { Module } from '@nestjs/common';
import { MagicLinksService } from './magic-links.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MagicLinksService],
  exports: [MagicLinksService],
})
export class MagicLinksModule {}
