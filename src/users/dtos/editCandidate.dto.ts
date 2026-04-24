import { IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class EditCandidateDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;
}
