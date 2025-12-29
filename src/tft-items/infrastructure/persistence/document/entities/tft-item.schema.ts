import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TftItemSchemaDocument = HydratedDocument<TftItemSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TftItemSchemaClass extends EntityDocumentHelper {
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

  @Prop({
    type: Boolean,
    default: false,
  })
  disabled?: boolean;

  @Prop({
    type: String,
    default: null,
  })
  type?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  texture?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  tier?: string | null;

  @Prop({
    type: [
      {
        match: { type: String, required: true },
        type: { type: String },
        multiplier: { type: String },
        full_match: { type: String, required: true },
        hash: { type: String },
        value: { type: MongooseSchema.Types.Mixed, required: true },
      },
    ],
    default: [],
  })
  variableMatches?: Array<{
    match: string;
    type?: string;
    multiplier?: string;
    full_match: string;
    hash?: string;
    value: number | string;
  }>;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TftItemSchema = SchemaFactory.createForClass(TftItemSchemaClass);

// Indexes để tối ưu query
TftItemSchema.index({ apiName: 1 });
TftItemSchema.index({ name: 1 });
TftItemSchema.index({ 'associatedTraits': 1 });
TftItemSchema.index({ unique: 1 });
TftItemSchema.index({ tier: 1 });

