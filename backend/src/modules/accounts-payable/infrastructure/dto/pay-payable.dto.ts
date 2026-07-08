import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsIn } from 'class-validator';

export class PayPayableDto {
  @IsString()
  @IsNotEmpty()
  accountPayableId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  @IsIn(['cash', 'card', 'transfer'])
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
