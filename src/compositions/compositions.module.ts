import { Module, forwardRef } from '@nestjs/common';
import { CompositionsService } from './compositions.service';
import { CompositionsController } from './compositions.controller';
import { DocumentCompositionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { ChampionsModule } from '../champions/champions.module';

const infrastructurePersistenceModule = DocumentCompositionPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => ChampionsModule),
  ],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [
    CompositionsService,
    infrastructurePersistenceModule, // Exports CompositionRepository
  ],
})
export class CompositionsModule {}

