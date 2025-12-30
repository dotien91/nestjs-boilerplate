import { Module } from '@nestjs/common';
import { CompositionsService } from './compositions.service';
import { CompositionsController } from './compositions.controller';
import { DocumentCompositionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { TftItemsModule } from '../tft-items/tft-items.module';
import { TftUnitsModule } from '../tft-units/tft-units.module';

const infrastructurePersistenceModule = DocumentCompositionPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, TftItemsModule, TftUnitsModule],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [
    CompositionsService,
    infrastructurePersistenceModule,
  ],
})
export class CompositionsModule {}

