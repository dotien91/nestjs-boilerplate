import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CompositionsModule } from '../compositions/compositions.module';
import { ItemLookupService } from './item-lookup.service';
import { TftUnitsModule } from '../tft-units/tft-units.module';

@Module({
  imports: [CompositionsModule, TftUnitsModule],
  controllers: [CrawlerController],
  providers: [CrawlerService, ItemLookupService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
