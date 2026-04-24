import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './users/user.module';
import { InterviewModule } from './interview/interview.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { MagicLinksModule } from './magic-links/magic-links.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TtsModule } from './tts/tts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UserModule,
    InterviewModule,
    AuthModule,
    EmailModule,
    MagicLinksModule,
    TtsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
