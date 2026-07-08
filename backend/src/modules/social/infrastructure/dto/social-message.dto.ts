import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  threadId?: string;

  @IsString()
  @IsOptional()
  recipientId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class CreateThreadDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  memberIds: string[];
}
