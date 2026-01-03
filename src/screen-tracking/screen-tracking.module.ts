import { Module } from '@nestjs/common';
import { ScreenTrackingService } from './screen-tracking.service';
import { ScreenTrackingController } from './screen-tracking.controller';
import { DocumentScreenTrackingPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule =
  DocumentScreenTrackingPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [ScreenTrackingController],
  providers: [ScreenTrackingService],
  exports: [ScreenTrackingService, infrastructurePersistenceModule],
})
export class ScreenTrackingModule {}

