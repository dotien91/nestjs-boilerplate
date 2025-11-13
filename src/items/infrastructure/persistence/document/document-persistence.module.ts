import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemSchemaClass, ItemSchema } from './entities/item.schema';
import { ItemsDocumentRepository } from './repositories/item.repository';
import { ItemMapper } from './mappers/item.mapper';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ItemSchemaClass.name,
        schema: ItemSchema,
      },
    ]),
  ],
  providers: [ItemsDocumentRepository, ItemMapper],
  exports: [ItemsDocumentRepository, ItemMapper],
})
export class DocumentItemPersistenceModule {}
