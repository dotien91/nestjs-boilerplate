import { Module } from '@nestjs/common';
import { TftTraitsService } from './tft-traits.service';
import { TftTraitsController } from './tft-traits.controller';
import { DocumentTftTraitPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftTraitPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftTraitsController],
  providers: [TftTraitsService],
  exports: [
    TftTraitsService,
    infrastructurePersistenceModule, // Exports TftTraitRepository
  ],
})
export class TftTraitsModule {}

