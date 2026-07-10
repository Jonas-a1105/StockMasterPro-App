import { IsString, IsOptional } from 'class-validator';

export class ApproveRejectPurchaseOrderDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
