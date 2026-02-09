import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateScreenTrackingDto {
  @ApiProperty({
    type: String,
    example: 'home',
    description: 'Tên màn hình (ví dụ: home, compositions, units)',
  })
  @IsNotEmpty()
  @IsString()
  screenName: string;

  @ApiPropertyOptional({
    type: String,
    example: 'device-uuid-xxx',
    description: 'Device ID (optional). Có thể gửi qua header x-device-id hoặc body.',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    type: String,
    example: '1.2.0',
    description: 'Phiên bản app (optional). Có thể gửi qua header x-app-version hoặc body.',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

