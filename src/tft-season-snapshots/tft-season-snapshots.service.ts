import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TftSeasonSnapshotDocument,
  TftSeasonSnapshotSchema,
} from './tft-season-snapshot.schema';

type UpsertSnapshotInput = Pick<
  TftSeasonSnapshotSchema,
  'season_id' | 'locale' | 'setKey' | 'source' | 'data' | 'warnings'
>;

@Injectable()
export class TftSeasonSnapshotsService {
  constructor(
    @InjectModel(TftSeasonSnapshotSchema.name)
    private readonly snapshotModel: Model<TftSeasonSnapshotDocument>,
  ) {}

  async upsert(input: UpsertSnapshotInput): Promise<TftSeasonSnapshotSchema> {
    return this.snapshotModel
      .findOneAndUpdate(
        { season_id: input.season_id, locale: input.locale },
        {
          $set: {
            ...input,
            crawledAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async find(
    season_id: string,
    locale: string,
  ): Promise<TftSeasonSnapshotSchema | null> {
    return this.snapshotModel.findOne({ season_id, locale }).lean();
  }
}

