import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthDto } from './dto/auth';
import { AuthService } from './auth.service';
import { MagicLinksService } from 'src/magic-links/magic-links.service';
import { Request as ExpressRequest, Response } from 'express';
import {
  FIFTEEN_MINUTES_IN_MILLISECONDS,
  THIRTY_DAYS_IN_MILLISECONDS,
} from 'src/constants';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinksService: MagicLinksService,
  ) {}
  @Post('login')
  async login(@Body() authDto: AuthDto) {
    console.log(authDto.email);
    return await this.authService.login(authDto.email);
  }

  @Post('register')
  async register(@Body() authDto: AuthDto) {
    return await this.authService.register(authDto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    console.log(req.user);
    return req.user;
  }

  @Get('verify-link')
  async verifyMe(
    @Query('link') link: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, status } =
      await this.authService.verifyLink(link);

    console.log(`access token is ${access_token}`);
    console.log(`refresh token is ${refresh_token}`);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: FIFTEEN_MINUTES_IN_MILLISECONDS,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: THIRTY_DAYS_IN_MILLISECONDS,
    });

    return { status };
  }

  @Get('refresh')
  async function(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!request || !request.cookies || !request.cookies.refresh_token) {
      console.log('no cookies :(');
      throw new UnauthorizedException('Unauthorized');
    }

    const { refresh_token } = request.cookies;
    if (!refresh_token) throw new UnauthorizedException('Unauthorized');

    const newTokens = await this.authService.verifyRefresh(refresh_token);

    res.cookie('access_token', newTokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: FIFTEEN_MINUTES_IN_MILLISECONDS,
    });

    res.cookie('refresh_token', newTokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: THIRTY_DAYS_IN_MILLISECONDS,
    });

    return { status: 'success' };
  }
}
