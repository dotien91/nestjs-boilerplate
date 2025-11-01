import { Module } from '@nestjs/common';
import { ChampionsService } from './champions.service';
import { ChampionsController } from './champions.controller';
import { DocumentChampionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { FilesModule } from '../files/files.module';

const infrastructurePersistenceModule = DocumentChampionPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, FilesModule],
  controllers: [ChampionsController],
  providers: [ChampionsService],
  exports: [
    ChampionsService,
    infrastructurePersistenceModule, // Exports ChampionRepository
  ],
})
export class ChampionsModule {}
