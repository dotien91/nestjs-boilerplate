import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CompositionsModule } from '../compositions/compositions.module';
import { ItemLookupService } from './item-lookup.service';
import { TftUnitsModule } from '../tft-units/tft-units.module';
import { MobalyticsSetCrawlerService } from './mobalytics-set-crawler.service';
import { TftSeasonSnapshotsModule } from '../tft-season-snapshots/tft-season-snapshots.module';
import { TftItemsModule } from '../tft-items/tft-items.module';
import { TftTraitsModule } from '../tft-traits/tft-traits.module';
import { TftAugmentsModule } from '../tft-augments/tft-augments.module';

@Module({
  imports: [
    CompositionsModule,
    TftUnitsModule,
    TftItemsModule,
    TftTraitsModule,
    TftAugmentsModule,
    TftSeasonSnapshotsModule,
  ],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    ItemLookupService,
    MobalyticsSetCrawlerService,
  ],
  exports: [CrawlerService, MobalyticsSetCrawlerService],
})
export class CrawlerModule {}
