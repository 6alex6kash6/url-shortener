import { IsUrl, IsOptional, IsDateString, IsString, MaxLength } from 'class-validator';

export class CreateUrlDto {
  @IsUrl()
  originalUrl: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alias?: string;
}