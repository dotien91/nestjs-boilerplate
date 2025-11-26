import { Module } from '@nestjs/common';
import { TftRolesService } from './tft-roles.service';
import { TftRolesController } from './tft-roles.controller';
import { DocumentTftRolePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentTftRolePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TftRolesController],
  providers: [TftRolesService],
  exports: [
    TftRolesService,
    infrastructurePersistenceModule, // Exports TftRoleRepository
  ],
})
export class TftRolesModule {}

