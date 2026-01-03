import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEmail,
  Min,
  Max,
} from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    type: String,
    example: 'Nội dung feedback của user',
    description: 'Nội dung feedback',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Đánh giá (1-5 sao)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'bug',
    description: 'Loại feedback (bug, feature, suggestion, other)',
    enum: ['bug', 'feature', 'suggestion', 'other'],
  })
  @IsOptional()
  @IsString()
  category?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'user@example.com',
    description: 'Email của user (nếu chưa đăng nhập)',
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

