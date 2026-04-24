import { IsNumber, IsString, MinLength } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @MinLength(1)
  role!: string;

  @IsNumber()
  experience!: number;
}
