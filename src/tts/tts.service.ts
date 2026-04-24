import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SynthesizeDto } from './dtos/synthesize.dto';

type SynthesizeResult = {
  audio: Buffer;
  contentType: string;
};

@Injectable()
export class TtsService {
  private readonly apiKey: string;
  private readonly deepgramSpeakUrl = 'https://api.deepgram.com/v1/speak';

  constructor(private readonly configService: ConfigService) {
    const deepgramApiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
    if (!deepgramApiKey) {
      throw new Error('DEEPGRAM_API_KEY is required');
    }
    this.apiKey = deepgramApiKey;
  }

  async synthesize(dto: SynthesizeDto): Promise<SynthesizeResult> {
    const params = new URLSearchParams({
      model: dto.voice ?? 'aura-2-thalia-en',
      encoding: dto.encoding ?? 'mp3',
    });

    if (dto.sampleRate) {
      params.set('sample_rate', String(dto.sampleRate));
    }

    const response = await fetch(
      `${this.deepgramSpeakUrl}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: dto.text }),
      },
    );

    if (!response.ok) {
      const payload = await response.text().catch(() => '');
      throw new BadGatewayException(
        `Deepgram TTS failed with status ${response.status}${payload ? `: ${payload}` : ''}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audio: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') ?? 'audio/mpeg',
    };
  }
}
