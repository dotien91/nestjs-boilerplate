import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftTraitRepository } from '../tft-trait.repository';
import { TftTraitSchema, TftTraitSchemaClass } from './entities/tft-trait.schema';
import { TftTraitsDocumentRepository } from './repositories/tft-trait.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: TftTraitSchemaClass.name,
    schema: TftTraitSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftTraitRepository,
      useClass: TftTraitsDocumentRepository,
    },
  ],
  exports: [TftTraitRepository, infrastructurePersistenceModule],
})
export class DocumentTftTraitPersistenceModule {}

