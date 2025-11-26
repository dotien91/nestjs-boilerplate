import { Module } from '@nestjs/common';
import { TftArmoryItemsService } from './tft-armory-items.service';
import { TftArmoryItemsController } from './tft-armory-items.controller';
import { DocumentTftArmoryItemPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftArmoryItemPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftArmoryItemsController],
  providers: [TftArmoryItemsService],
  exports: [
    TftArmoryItemsService,
    infrastructurePersistenceModule, // Exports TftArmoryItemRepository
  ],
})
export class TftArmoryItemsModule {}

