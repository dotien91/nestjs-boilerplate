import { Module } from '@nestjs/common';
import { TftAugmentOddsService } from './tft-augment-odds.service';
import { TftAugmentOddsController } from './tft-augment-odds.controller';
import { DocumentTftAugmentOddPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftAugmentOddPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftAugmentOddsController],
  providers: [TftAugmentOddsService],
  exports: [
    TftAugmentOddsService,
    infrastructurePersistenceModule, // Exports TftAugmentOddRepository
  ],
})
export class TftAugmentOddsModule {}

