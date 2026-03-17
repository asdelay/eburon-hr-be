import { IsString, MinLength } from 'class-validator';

export class EvaluateAnswerDto {
  @IsString()
  @MinLength(1)
  question: string;

  @IsString()
  @MinLength(1)
  answer: string;

  @IsString()
  @MinLength(1)
  role: string;
}
