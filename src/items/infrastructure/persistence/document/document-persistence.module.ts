import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ItemSchema,
  ItemSchemaClass,
} from './entities/item.schema';
import { ItemRepository } from '../item.repository';
import { ItemsDocumentRepository } from './repositories/item.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ItemSchemaClass.name, schema: ItemSchema },
    ]),
  ],
  providers: [
    {
      provide: ItemRepository,
      useClass: ItemsDocumentRepository,
    },
  ],
  exports: [ItemRepository],
})
export class DocumentItemPersistenceModule {}

