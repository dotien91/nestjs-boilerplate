import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    type: String,
    example: 'Nội dung feedback của user',
    description: 'Nội dung feedback',
  })
  @IsNotEmpty({ message: 'Nội dung feedback không được để trống' })
  @IsString({ message: 'Nội dung feedback phải là chuỗi' })
  content: string;

  @ApiPropertyOptional({
    type: String,
    example: 'user@example.com',
    description: 'Email của user (nếu chưa đăng nhập). Nếu có email thì phải là email hợp lệ.',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string | null;
}

