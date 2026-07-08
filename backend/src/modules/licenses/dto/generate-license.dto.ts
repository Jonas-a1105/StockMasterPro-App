import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class GenerateLicenseDto {
  @IsString()
  @IsOptional()
  targetTenantId?: string;

  @IsNumber()
  @Min(1)
  days: number;

  @IsString()
  @IsOptional()
  tier?: string;
}
