import { IsArray, IsOptional, IsString, IsNumber, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReceiveItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items?: ReceiveItemDto[];
}
