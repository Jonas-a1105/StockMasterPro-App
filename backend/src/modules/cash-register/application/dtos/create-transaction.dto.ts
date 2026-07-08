import { IsIn, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(['income', 'expense', 'sale', 'refund'])
  type!: 'income' | 'expense' | 'sale' | 'refund';

  @IsString()
  @IsNotEmpty()
  description!: string;
}
