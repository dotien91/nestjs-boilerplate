import { Module } from '@nestjs/common';
import { TftAugmentsService } from './tft-augments.service';
import { TftAugmentsController } from './tft-augments.controller';
import { DocumentTftAugmentPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftAugmentPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftAugmentsController],
  providers: [TftAugmentsService],
  exports: [
    TftAugmentsService,
    infrastructurePersistenceModule, // Exports TftAugmentRepository
  ],
})
export class TftAugmentsModule {}

