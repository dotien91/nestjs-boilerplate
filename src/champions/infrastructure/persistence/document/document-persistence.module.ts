import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChampionSchema,
  ChampionSchemaClass,
} from './entities/champion.schema';
import { ChampionRepository } from '../champion.repository';
import { ChampionsDocumentRepository } from './repositories/champion.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChampionSchemaClass.name, schema: ChampionSchema },
    ]),
  ],
  providers: [
    {
      provide: ChampionRepository,
      useClass: ChampionsDocumentRepository,
    },
  ],
  exports: [ChampionRepository],
})
export class DocumentChampionPersistenceModule {}
