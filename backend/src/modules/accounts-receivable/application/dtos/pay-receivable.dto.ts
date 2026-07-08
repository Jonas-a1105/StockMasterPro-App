import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayReceivableDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(['cash', 'card', 'transfer'])
  paymentMethod!: 'cash' | 'card' | 'transfer';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paidAt?: string;
}
