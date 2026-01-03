import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { DocumentFeedbackPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = DocumentFeedbackPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService, infrastructurePersistenceModule],
})
export class FeedbackModule {}

