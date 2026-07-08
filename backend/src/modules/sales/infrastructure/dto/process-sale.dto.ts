import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  ArrayMinSize,
  IsIn,
} from 'class-validator';

class SaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ProcessSaleDto {
  @IsArray()
  @ArrayMinSize(1)
  items: SaleItemDto[];

  @IsString()
  @IsOptional()
  @IsIn(['cash', 'card', 'credit', 'transfer'])
  paymentMethod?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  customerId?: string;
}
