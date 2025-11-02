import { Module, forwardRef } from '@nestjs/common';
import { ChampionsService } from './champions.service';
import { ChampionsController } from './champions.controller';
import { DocumentChampionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { FilesModule } from '../files/files.module';
import { OriginsModule } from '../origin/origins.module';

const infrastructurePersistenceModule = DocumentChampionPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    FilesModule,
    forwardRef(() => OriginsModule),
  ],
  controllers: [ChampionsController],
  providers: [ChampionsService],
  exports: [
    ChampionsService,
    infrastructurePersistenceModule, // Exports ChampionRepository
  ],
})
export class ChampionsModule {}
