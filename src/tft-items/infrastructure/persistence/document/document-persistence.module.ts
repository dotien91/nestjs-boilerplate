import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftItemRepository } from '../tft-item.repository';
import { TftItemSchema, TftItemSchemaClass } from './entities/tft-item.schema';
import { TftItemsDocumentRepository } from './repositories/tft-item.repository';
import {
  CompositionSchemaClass,
  CompositionSchema,
} from '../../../../compositions/infrastructure/persistence/document/entities/composition.schema';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  { name: TftItemSchemaClass.name, schema: TftItemSchema },
  { name: CompositionSchemaClass.name, schema: CompositionSchema },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftItemRepository,
      useClass: TftItemsDocumentRepository,
    },
  ],
  exports: [TftItemRepository, infrastructurePersistenceModule],
})
export class DocumentTftItemPersistenceModule {}

