import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftArmoryItemRepository } from '../tft-armory-item.repository';
import {
  TftArmoryItemSchema,
  TftArmoryItemSchemaClass,
} from './entities/tft-armory-item.schema';
import { TftArmoryItemsDocumentRepository } from './repositories/tft-armory-item.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: TftArmoryItemSchemaClass.name,
    schema: TftArmoryItemSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftArmoryItemRepository,
      useClass: TftArmoryItemsDocumentRepository,
    },
  ],
  exports: [TftArmoryItemRepository, infrastructurePersistenceModule],
})
export class DocumentTftArmoryItemPersistenceModule {}

