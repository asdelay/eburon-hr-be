import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SynthesizeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsString()
  @IsIn(['aura-2-thalia-en', 'aura-2-asteria-en', 'aura-2-luna-en'])
  voice?: string;

  @IsOptional()
  @IsString()
  @IsIn(['mp3', 'linear16', 'opus'])
  encoding?: string;

  @IsOptional()
  @IsInt()
  @Min(8000)
  @Max(48000)
  sampleRate?: number;
}
