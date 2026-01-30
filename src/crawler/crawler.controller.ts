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
    summary: 'Crawl chi tiết 1 comp (Test)',
    description: 'Crawl dữ liệu từ URL Mobalytics và trả về JSON (Không lưu vào DB). Dùng để test parser.',
  })
  @ApiCreatedResponse({
    description: 'Dữ liệu composition raw',
  })
  @Post('comp-detail')
  @HttpCode(HttpStatus.OK)
  async crawlCompDetail(@Body() dto: CrawlCompDetailDto) {
    // Hàm này trong Service hiện tại chỉ trả về data, không lưu DB
    return this.crawlerService.crawlCompDetail(dto.url);
  }

  @ApiOperation({
    summary: 'Lấy danh sách link Comps (Test)',
    description: 'Quét trang team-comps để lấy danh sách URL (Dùng để test số lượng comp tìm thấy).',
  })
  @ApiCreatedResponse({
    description: 'Danh sách các URL tìm thấy',
  })
  @Post('team-comps')
  @HttpCode(HttpStatus.OK)
  async crawlTeamComps(@Body() dto: CrawlTeamCompsDto) {
    return this.crawlerService.crawlTeamComps(dto.url);
  }

  @ApiOperation({
    summary: 'Trigger Crawl All (Manual)',
    description: 'Chạy quy trình: Lấy List -> Crawl từng cái -> Lưu/Update DB -> Xóa comp cũ.',
  })
  @ApiCreatedResponse({
    description: 'Thống kê số lượng tạo mới và cập nhật',
  })
  @Post('crawl-all')
  @HttpCode(HttpStatus.CREATED)
  async crawlAll() {
    return this.crawlerService.crawlAllCompositions();
  }

  @ApiOperation({
    summary: 'Trigger Crawl Units Tier (Manual)',
    description: 'Cập nhật tier cho các unit từ MetaTFT.',
  })
  @ApiCreatedResponse({
    description: 'Trạng thái cập nhật',
  })
  @Post('units-tier')
  @HttpCode(HttpStatus.OK)
  async crawlUnitsTier() {
    await this.crawlerService.handleDailyUnitTierCrawl();
    return { status: 'Unit tiers crawl triggered successfully' };
  }
}