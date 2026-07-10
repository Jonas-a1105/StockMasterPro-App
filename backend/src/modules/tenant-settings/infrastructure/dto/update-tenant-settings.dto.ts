import { IsOptional, IsDecimal, Min, Max, IsString, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTenantSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsDecimal()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  taxName?: string;

  @IsOptional()
  @IsString()
  currencySymbol?: string;

  @IsOptional()
  @IsIn(['before', 'after'])
  currencyPosition?: 'before' | 'after';

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(4)
  decimalPlaces?: number;

  @IsOptional()
  @IsIn(['bs', 'usd', 'both'])
  displayCurrency?: 'bs' | 'usd' | 'both';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  manualExchangeRate?: number;

  @IsOptional()
  @IsString()
  companyTaxId?: string;

  @IsOptional()
  @IsString()
  companyFiscalAddress?: string;

  @IsOptional()
  @IsString()
  companyPhone?: string;
}
