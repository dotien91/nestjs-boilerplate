import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TftArmoryItemSchemaDocument =
  HydratedDocument<TftArmoryItemSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TftArmoryItemSchemaClass extends EntityDocumentHelper {
  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  apiName: string;

  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    type: String,
    default: null,
  })
  enName?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  desc?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  icon?: string | null;

  @Prop({
    type: [String],
    default: [],
  })
  associatedTraits?: string[];

  @Prop({
    type: [String],
    default: [],
  })
  incompatibleTraits?: string[];

  @Prop({
    type: [String],
    default: [],
  })
  composition?: string[];

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  effects?: Record<string, any>;

  @Prop({
    type: [String],
    default: [],
  })
  tags?: string[];

  @Prop({
    type: Boolean,
    default: false,
  })
  unique?: boolean;

  @Prop({
    type: String,
    default: null,
  })
  from?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  itemId?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TftArmoryItemSchema = SchemaFactory.createForClass(
  TftArmoryItemSchemaClass,
);

// Indexes để tối ưu query
TftArmoryItemSchema.index({ apiName: 1 });
TftArmoryItemSchema.index({ name: 1 });

