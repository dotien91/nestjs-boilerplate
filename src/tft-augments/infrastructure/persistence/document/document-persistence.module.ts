import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftAugmentRepository } from '../tft-augment.repository';
import {
  TftAugmentSchema,
  TftAugmentSchemaClass,
} from './entities/tft-augment.schema';
import { TftAugmentsDocumentRepository } from './repositories/tft-augment.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: TftAugmentSchemaClass.name,
    schema: TftAugmentSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftAugmentRepository,
      useClass: TftAugmentsDocumentRepository,
    },
  ],
  exports: [TftAugmentRepository, infrastructurePersistenceModule],
})
export class DocumentTftAugmentPersistenceModule {}

