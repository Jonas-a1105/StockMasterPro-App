import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenSessionDto {
  @IsNumber()
  @Min(0)
  openingBalance!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
