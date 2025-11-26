import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftUnitRepository } from '../tft-unit.repository';
import { TftUnitSchema, TftUnitSchemaClass } from './entities/tft-unit.schema';
import { TftUnitsDocumentRepository } from './repositories/tft-unit.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: TftUnitSchemaClass.name,
    schema: TftUnitSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftUnitRepository,
      useClass: TftUnitsDocumentRepository,
    },
  ],
  exports: [TftUnitRepository, infrastructurePersistenceModule],
})
export class DocumentTftUnitPersistenceModule {}

