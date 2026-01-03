import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

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
    type: String,
    example: 'user@example.com',
    description: 'Email của user (nếu chưa đăng nhập)',
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

