import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { CrawlCompDetailDto } from './dto/crawl-comp-detail.dto';
import { CrawlTeamCompsDto } from './dto/crawl-team-comps.dto';

@ApiTags('Crawler')
@Controller({
  path: 'crawler',
  version: '1',
})
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @ApiOperation({
    summary: 'Crawl chi tiết comp từ URL',
    description: 'Crawl trang comp (Mobalytics) và trả về schema composition.',
  })
  @ApiCreatedResponse({
    description: 'Dữ liệu composition đã parse từ trang web',
  })
  @Post('comp-detail')
  @HttpCode(HttpStatus.CREATED)
  async crawlCompDetail(@Body() dto: CrawlCompDetailDto) {
    return this.crawlerService.crawlCompDetail(dto.url);
  }

  @ApiOperation({
    summary: 'Crawl danh sách comps từ trang team-comps',
    description: 'Crawl trang team-comps và trả về danh sách link comp.',
  })
  @ApiCreatedResponse({
    description: 'Danh sách comp links đã parse từ trang web',
  })
  @Post('team-comps')
  @HttpCode(HttpStatus.CREATED)
  async crawlTeamComps(@Body() dto: CrawlTeamCompsDto) {
    return this.crawlerService.crawlTeamComps(dto.url);
  }

  @ApiOperation({
    summary: 'Crawl toàn bộ comps (manual trigger)',
    description: 'Chạy full pipeline: lấy danh sách rồi crawl chi tiết từng comp.',
  })
  @ApiCreatedResponse({
    description: 'Danh sách composition đã parse từ trang web',
  })
  @Post('crawl-all')
  @HttpCode(HttpStatus.CREATED)
  async crawlAll() {
    return this.crawlerService.crawlAllCompositions();
  }

  @ApiOperation({
    summary: 'Crawl tier units từ MetaTFT (manual trigger)',
    description: 'Crawl trang MetaTFT units và cập nhật tier cho units.',
  })
  @ApiCreatedResponse({
    description: 'Kết quả cập nhật tier units',
  })
  @Post('units-tier')
  @HttpCode(HttpStatus.CREATED)
  async crawlUnitsTier() {
    await this.crawlerService.handleDailyUnitTierCrawl();
    return { status: 'ok' };
  }
}
