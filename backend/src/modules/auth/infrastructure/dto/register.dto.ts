import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsString } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
