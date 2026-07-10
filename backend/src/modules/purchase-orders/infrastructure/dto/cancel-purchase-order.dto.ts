import { IsString, IsOptional } from 'class-validator';

export class CancelPurchaseOrderDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
