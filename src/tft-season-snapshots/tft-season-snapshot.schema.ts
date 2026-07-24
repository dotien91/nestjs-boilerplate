import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TftSeasonSnapshotDocument =
  HydratedDocument<TftSeasonSnapshotSchema>;

@Schema({
  collection: 'tft-season-snapshots',
  timestamps: true,
})
export class TftSeasonSnapshotSchema {
  @Prop({ required: true, type: String })
  season_id: string;

  @Prop({ required: true, type: String, default: 'en_us' })
  locale: string;

  @Prop({ required: true, type: String })
  setKey: string;

  @Prop({ required: true, type: String })
  source: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  data: Record<string, unknown>;

  @Prop({ required: true, type: Date })
  crawledAt: Date;

  @Prop({ type: [String], default: [] })
  warnings: string[];
}

export const TftSeasonSnapshotSchemaFactory = SchemaFactory.createForClass(
  TftSeasonSnapshotSchema,
);

TftSeasonSnapshotSchemaFactory.index(
  { season_id: 1, locale: 1 },
  { unique: true },
);

