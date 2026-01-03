import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScreenTrackingRepository } from '../screen-tracking.repository';
import {
  ScreenTrackingSchema,
  ScreenTrackingSchemaClass,
} from './entities/screen-tracking.schema';
import { ScreenTrackingDocumentRepository } from './repositories/screen-tracking.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: ScreenTrackingSchemaClass.name,
    schema: ScreenTrackingSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: ScreenTrackingRepository,
      useClass: ScreenTrackingDocumentRepository,
    },
  ],
  exports: [ScreenTrackingRepository, infrastructurePersistenceModule],
})
export class DocumentScreenTrackingPersistenceModule {}

