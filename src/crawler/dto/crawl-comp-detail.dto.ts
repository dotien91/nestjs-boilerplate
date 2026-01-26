import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CrawlCompDetailDto {
  @ApiProperty({
    type: String,
    example: 'https://mobalytics.gg/tft/comps-guide/some-comp',
    description: 'URL trang comp cần crawl',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;
}
