import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QaPair {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}

class PerAnswerScore {
  @IsNumber()
  confidenceDelta!: number;
}

export class ConfidenceDto {
  @IsInt()
  @Type(() => Number)
  candidateId!: number;

  @IsString()
  @MinLength(1)
  role!: string;

  @IsNumber()
  experience!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QaPair)
  answers!: QaPair[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerAnswerScore)
  @IsOptional()
  perAnswerScores?: PerAnswerScore[];
}
