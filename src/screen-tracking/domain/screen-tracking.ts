import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idType = String;

export class ScreenTracking {
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
    example: 'home',
    description: 'Tên màn hình (ví dụ: home, compositions, units)',
  })
  screenName: string;

  @ApiProperty({
    type: String,
    example: '/compositions',
    description: 'Đường dẫn URL của màn hình',
  })
  screenPath: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Metadata bổ sung (device, browser, etc.)',
  })
  metadata?: Record<string, any> | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}

