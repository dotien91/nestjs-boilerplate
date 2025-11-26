import { Module } from '@nestjs/common';
import { TftUnitsService } from './tft-units.service';
import { TftUnitsController } from './tft-units.controller';
import { DocumentTftUnitPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftUnitPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftUnitsController],
  providers: [TftUnitsService],
  exports: [
    TftUnitsService,
    infrastructurePersistenceModule, // Exports TftUnitRepository
  ],
})
export class TftUnitsModule {}

