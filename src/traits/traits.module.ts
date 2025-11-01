import { Module } from '@nestjs/common';
import { TraitsService } from './traits.service';
import { TraitsController } from './traits.controller';
import { DocumentTraitPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { FilesModule } from '../files/files.module';

const infrastructurePersistenceModule = DocumentTraitPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, FilesModule],
  controllers: [TraitsController],
  providers: [TraitsService],
  exports: [TraitsService, infrastructurePersistenceModule],
})
export class TraitsModule {}
