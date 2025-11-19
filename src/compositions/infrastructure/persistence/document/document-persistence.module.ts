import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompositionSchemaClass, CompositionSchema } from './entities/composition.schema';
import { CompositionsDocumentRepository } from './repositories/composition.repository';
import { CompositionRepository } from '../composition.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CompositionSchemaClass.name,
        schema: CompositionSchema,
      },
    ]),
  ],
  providers: [
    {
      provide: CompositionRepository,
      useClass: CompositionsDocumentRepository,
    },
  ],
  exports: [CompositionRepository],
})
export class DocumentCompositionPersistenceModule {}

