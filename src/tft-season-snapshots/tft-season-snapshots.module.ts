import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TftSeasonSnapshotSchema,
  TftSeasonSnapshotSchemaFactory,
} from './tft-season-snapshot.schema';
import { TftSeasonSnapshotsService } from './tft-season-snapshots.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TftSeasonSnapshotSchema.name,
        schema: TftSeasonSnapshotSchemaFactory,
      },
    ]),
  ],
  providers: [TftSeasonSnapshotsService],
  exports: [TftSeasonSnapshotsService],
})
export class TftSeasonSnapshotsModule {}

