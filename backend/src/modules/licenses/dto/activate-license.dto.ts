import { IsString, IsNotEmpty } from 'class-validator';

export class ActivateLicenseDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
