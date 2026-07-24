import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CrawlerService } from './crawler.service';
import { CrawlCompDetailDto } from './dto/crawl-comp-detail.dto';
import { CrawlTeamCompsDto } from './dto/crawl-team-comps.dto';
import { CrawlMobalyticsSetDto } from './dto/crawl-mobalytics-set.dto';
import { CrawlSetDto } from './dto/crawl-set.dto';
import { MobalyticsSetCrawlerService } from './mobalytics-set-crawler.service';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Crawler')
@Controller({
  path: 'crawler',
  version: '1',
})
export class CrawlerController {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly mobalyticsSetCrawlerService: MobalyticsSetCrawlerService,
  ) {}

  @ApiOperation({
    summary: 'Crawl và import toàn bộ dữ liệu của một mùa TFT',
    description:
      'Một request crawl units, items, traits, augments và compositions; lưu snapshot và upsert từng collection theo season_id.',
  })
  @Post('crawl-set')
  @HttpCode(HttpStatus.OK)
  async crawlSet(@Body() dto: CrawlSetDto) {
    const seasonId = dto.season_id.toLowerCase().replace(/^set/, '');
    const result = await this.mobalyticsSetCrawlerService.crawl({
      setKey: `set${seasonId}`,
      locale: dto.locale ?? 'en_us',
      persist: true,
      resources: dto.resources,
    });
    const imported = await this.mobalyticsSetCrawlerService.persistDataset(
      result.data,
      { downloadImages: dto.download_images ?? false },
    );
    return {
      season_id: seasonId,
      locale: dto.locale ?? 'en_us',
      resources:
        dto.resources ?? [
          'units',
          'items',
          'traits',
          'augments',
          'compositions',
        ],
      source: result.data.source,
      crawled: result.counts,
      imported,
      warnings: result.warnings,
    };
  }

  @ApiOperation({
    summary: 'Crawl toàn bộ public data của một Mobalytics set',
    description:
      'Crawl champions, champion details, items, traits, augments và team comps. Không gọi /api/tft. Có thể upsert snapshot theo season_id + locale.',
  })
  @Post('mobalytics-set')
  @HttpCode(HttpStatus.OK)
  async crawlMobalyticsSet(@Body() dto: CrawlMobalyticsSetDto) {
    return this.mobalyticsSetCrawlerService.crawl({
      setKey: dto.setKey,
      locale: dto.locale ?? 'en_us',
      persist: dto.persist ?? true,
    }).then(async (result) => ({
      ...result,
      imported: await this.mobalyticsSetCrawlerService.persistDataset(
        result.data,
        { downloadImages: dto.download_images ?? false },
      ),
    }));
  }

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
