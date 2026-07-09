import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateReceivableDto {
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @IsUUID()
  @IsOptional()
  saleId?: string;

  @IsNumber()
  @Min(0.01)
  totalAmount!: number;

  @IsString()
  @IsNotEmpty()
  dueDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
