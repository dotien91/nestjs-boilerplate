import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idType = String;

export class Feedback {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiPropertyOptional({
    type: String,
    description: 'ID của user (null nếu user chưa đăng nhập)',
  })
  userId?: string | null;

  @ApiProperty({
    type: String,
    example: 'Nội dung feedback của user',
    description: 'Nội dung feedback',
  })
  content: string;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Đánh giá (1-5 sao)',
  })
  rating?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: 'bug',
    description: 'Loại feedback (bug, feature, suggestion, other)',
  })
  category?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'user@example.com',
    description: 'Email của user (nếu chưa đăng nhập)',
  })
  email?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

