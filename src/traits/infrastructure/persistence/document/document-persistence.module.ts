import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TraitSchema, TraitSchemaClass } from './entities/trait.schema';
import { TraitRepository } from '../trait.repository';
import { TraitsDocumentRepository } from './repositories/trait.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TraitSchemaClass.name, schema: TraitSchema },
    ]),
  ],
  providers: [
    {
      provide: TraitRepository,
      useClass: TraitsDocumentRepository,
    },
  ],
  exports: [TraitRepository],
})
export class DocumentTraitPersistenceModule {}
