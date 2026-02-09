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
    type: String,
    example: 'en',
    description: 'Language code từ header x-lang',
  })
  lang?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'US',
    description: 'Location/country code từ header x-location',
  })
  location?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'device-uuid-xxx',
    description: 'Device ID từ header x-device-id',
  })
  deviceId?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '1.2.0',
    description: 'Phiên bản app từ header x-app-version',
  })
  appVersion?: string | null;

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

