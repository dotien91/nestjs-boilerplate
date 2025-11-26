import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftRoleRepository } from '../tft-role.repository';
import { TftRoleSchema, TftRoleSchemaClass } from './entities/tft-role.schema';
import { TftRolesDocumentRepository } from './repositories/tft-role.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: TftRoleSchemaClass.name,
    schema: TftRoleSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftRoleRepository,
      useClass: TftRolesDocumentRepository,
    },
  ],
  exports: [TftRoleRepository, infrastructurePersistenceModule],
})
export class DocumentTftRolePersistenceModule {}

