import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SynthesizeDto } from './dtos/synthesize.dto';
import { TtsService } from './tts.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}
  @UseGuards(JwtAuthGuard)
  @Post('synthesize')
  async synthesize(@Body() dto: SynthesizeDto, @Res() res: Response) {
    const { audio, contentType } = await this.ttsService.synthesize(dto);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', audio.length);
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  }
}
