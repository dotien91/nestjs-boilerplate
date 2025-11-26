import { Module } from '@nestjs/common';
import { CompositionsService } from './compositions.service';
import { CompositionsController } from './compositions.controller';
import { DocumentCompositionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentCompositionPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [
    CompositionsService,
    infrastructurePersistenceModule, // Exports CompositionRepository
  ],
})
export class CompositionsModule {}

