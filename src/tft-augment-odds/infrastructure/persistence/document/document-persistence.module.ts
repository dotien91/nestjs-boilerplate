import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftAugmentOddRepository } from '../tft-augment-odd.repository';
import {
  TftAugmentOddSchema,
  TftAugmentOddSchemaClass,
} from './entities/tft-augment-odd.schema';
import { TftAugmentOddsDocumentRepository } from './repositories/tft-augment-odd.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: TftAugmentOddSchemaClass.name,
    schema: TftAugmentOddSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: TftAugmentOddRepository,
      useClass: TftAugmentOddsDocumentRepository,
    },
  ],
  exports: [TftAugmentOddRepository, infrastructurePersistenceModule],
})
export class DocumentTftAugmentOddPersistenceModule {}

