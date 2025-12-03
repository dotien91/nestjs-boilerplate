import { Module } from '@nestjs/common';
import { CompositionsService } from './compositions.service';
import { CompositionsController } from './compositions.controller';
import { DocumentCompositionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { TftUnitsModule } from '../tft-units/tft-units.module';
import { TftTraitsModule } from '../tft-traits/tft-traits.module';

const infrastructurePersistenceModule = DocumentCompositionPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    TftUnitsModule,
    TftTraitsModule,
  ],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [
    CompositionsService,
    infrastructurePersistenceModule, // Exports CompositionRepository
  ],
})
export class CompositionsModule {}

