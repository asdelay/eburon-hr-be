import { IsString, MinLength } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @MinLength(1)
  role: string;

  @IsString()
  @MinLength(1)
  experience: string;
}
