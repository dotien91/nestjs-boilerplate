import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OriginSchema, OriginSchemaClass } from './entities/origin.schema';
import { OriginRepository } from '../origin.repository';
import { OriginsDocumentRepository } from './repositories/origin.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OriginSchemaClass.name, schema: OriginSchema },
    ]),
  ],
  providers: [
    {
      provide: OriginRepository,
      useClass: OriginsDocumentRepository,
    },
  ],
  exports: [OriginRepository],
})
export class DocumentOriginPersistenceModule {}
