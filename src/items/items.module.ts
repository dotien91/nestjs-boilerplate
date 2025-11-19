import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { IconsController } from './icons.controller';
import { DocumentItemPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentItemPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
  ],
  controllers: [ItemsController, IconsController],
  providers: [ItemsService],
  exports: [
    ItemsService,
    infrastructurePersistenceModule, // Exports ItemRepository
  ],
})
export class ItemsModule {}

