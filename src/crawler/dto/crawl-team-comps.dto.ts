import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CrawlTeamCompsDto {
  @ApiPropertyOptional({
    type: String,
    example: 'https://mobalytics.gg/tft/team-comps',
    description: 'URL trang team comps cần crawl (mặc định là Mobalytics).',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;
}
