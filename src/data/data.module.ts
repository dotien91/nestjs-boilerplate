import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { TftSeasonSnapshotsModule } from '../tft-season-snapshots/tft-season-snapshots.module';

@Module({
  imports: [TftSeasonSnapshotsModule],
  controllers: [DataController],
})
export class DataModule {}
