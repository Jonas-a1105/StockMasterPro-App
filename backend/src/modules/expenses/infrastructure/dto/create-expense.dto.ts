import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsIn, IsDateString } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['rent', 'utilities', 'salaries', 'supplies', 'maintenance', 'transport', 'marketing', 'food', 'other'])
  category: string;

  @IsString()
  @IsOptional()
  @IsIn(['cash', 'card', 'transfer'])
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  expenseDate: string;
}
