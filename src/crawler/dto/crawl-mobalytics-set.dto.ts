import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class CrawlMobalyticsSetDto {
  @ApiProperty({
    type: String,
    example: 'set18',
    description: 'Mobalytics set key.',
  })
  @IsString()
  @Matches(/^set\d+$/)
  setKey: string;

  @ApiPropertyOptional({
    type: String,
    example: 'en_us',
    default: 'en_us',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en_us'])
  locale?: string;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Upsert snapshot vào MongoDB sau khi crawl thành công.',
  })
  @IsOptional()
  @IsBoolean()
  persist?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Tải ảnh unit/item về storage của backend.',
  })
  @IsOptional()
  @IsBoolean()
  download_images?: boolean;
}
