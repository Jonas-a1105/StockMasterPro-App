import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

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
}
