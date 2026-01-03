import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackRepository } from '../feedback.repository';
import {
  FeedbackSchema,
  FeedbackSchemaClass,
} from './entities/feedback.schema';
import { FeedbackDocumentRepository } from './repositories/feedback.repository';

const infrastructurePersistenceModule = MongooseModule.forFeature([
  {
    name: FeedbackSchemaClass.name,
    schema: FeedbackSchema,
  },
]);

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [
    {
      provide: FeedbackRepository,
      useClass: FeedbackDocumentRepository,
    },
  ],
  exports: [FeedbackRepository, infrastructurePersistenceModule],
})
export class DocumentFeedbackPersistenceModule {}

