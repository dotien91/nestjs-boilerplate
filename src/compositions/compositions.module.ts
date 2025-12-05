import { Module } from '@nestjs/common';
import { CompositionsService } from './compositions.service';
import { CompositionsController } from './compositions.controller';
import { DocumentCompositionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { TftUnitsModule } from '../tft-units/tft-units.module';

const infrastructurePersistenceModule = DocumentCompositionPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    TftUnitsModule,
  ],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [
    CompositionsService,
    infrastructurePersistenceModule, // Exports CompositionRepository
  ],
})
export class CompositionsModule {}

