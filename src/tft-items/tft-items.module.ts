import { Module } from '@nestjs/common';
import { TftItemsService } from './tft-items.service';
import { TftItemsController } from './tft-items.controller';
import { DocumentTftItemPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftItemPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftItemsController],
  providers: [TftItemsService],
  exports: [
    TftItemsService,
    infrastructurePersistenceModule, // Exports TftItemRepository
  ],
})
export class TftItemsModule {}

