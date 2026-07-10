import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class TransferItemDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateWarehouseTransferDto {
  @IsString()
  fromWarehouseId: string;

  @IsString()
  toWarehouseId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}

export class UpdateWarehouseTransferDto {
  @IsOptional()
  @IsEnum(['pending', 'in_transit', 'completed', 'cancelled'])
  status?: 'pending' | 'in_transit' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  notes?: string;
}
