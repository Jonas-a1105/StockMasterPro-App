import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateReactionDto {
  @IsString()
  @IsOptional()
  postId?: string;

  @IsString()
  @IsOptional()
  commentId?: string;

  @IsString()
  @IsOptional()
  catalogId?: string;

  @IsString()
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'])
  @IsOptional()
  type?: string;
}
