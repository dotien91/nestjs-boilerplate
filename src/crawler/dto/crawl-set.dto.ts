import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export const crawlSetResources = [
  'units',
  'items',
  'traits',
  'augments',
  'compositions',
] as const;

export type CrawlSetResource = (typeof crawlSetResources)[number];

export class CrawlSetDto {
  @ApiProperty({
    type: String,
    example: '18',
    description: 'ID mùa TFT. Có thể truyền 18 hoặc set18.',
  })
  @IsString()
  @Matches(/^(?:set)?\d+$/i)
  season_id: string;

  @ApiPropertyOptional({ type: String, example: 'en_us', default: 'en_us' })
  @IsOptional()
  @IsString()
  @IsIn(['en_us'])
  locale?: string;

  @ApiPropertyOptional({
    type: [String],
    enum: crawlSetResources,
    example: ['units', 'compositions'],
    description: 'Nhóm dữ liệu cần crawl. Không truyền nghĩa là crawl tất cả.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(crawlSetResources, { each: true })
  resources?: CrawlSetResource[];

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Tải ảnh unit/item về storage của backend.',
  })
  @IsOptional()
  @IsBoolean()
  download_images?: boolean;
}
