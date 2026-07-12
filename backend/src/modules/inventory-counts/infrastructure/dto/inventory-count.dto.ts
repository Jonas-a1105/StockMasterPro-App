import {
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateInventoryCountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productWarehouseIds?: string[];
}

export class UpdateInventoryCountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateCountItemDto {
  @IsNumber()
  @Min(0)
  countedQty: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InventoryCountFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
