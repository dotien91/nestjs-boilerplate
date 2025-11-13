import { Module, forwardRef } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { DocumentItemPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentItemPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService, infrastructurePersistenceModule],
})
export class ItemsModule {}
