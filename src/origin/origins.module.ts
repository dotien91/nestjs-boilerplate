import { Module, forwardRef } from '@nestjs/common';
import { OriginsService } from './origins.service';
import { OriginsController } from './origins.controller';
import { DocumentOriginPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { FilesModule } from '../files/files.module';
import { ChampionsModule } from '../champions/champions.module';

const infrastructurePersistenceModule = DocumentOriginPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    FilesModule,
    forwardRef(() => ChampionsModule),
  ],
  controllers: [OriginsController],
  providers: [OriginsService],
  exports: [
    OriginsService,
    infrastructurePersistenceModule, // Exports OriginRepository
  ],
})
export class OriginsModule {}
