import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type ItemSchemaDocument = HydratedDocument<ItemSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ItemSchemaClass extends EntityDocumentHelper {
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    type: String,
    default: null,
    unique: true,
    sparse: true,
  })
  apiName?: string | null;

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
  composition?: string[] | null;

  @Prop({
    type: [String],
    default: [],
  })
  associatedTraits?: string[] | null;

  @Prop({
    type: [String],
    default: [],
  })
  incompatibleTraits?: string[] | null;

  @Prop({
    type: [String],
    default: [],
  })
  tags?: string[] | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  unique?: boolean | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  disabled?: boolean | null;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  effects?: Record<string, any> | null;

  @Prop({
    type: [
      {
        match: { type: String, required: true },
        type: { type: String, default: null },
        multiplier: { type: String, default: null },
        full_match: { type: String, required: true },
        hash: { type: String, default: null },
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
  }> | null;

  @Prop({
    type: String,
    default: null,
  })
  from?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date | null;
}

export const ItemSchema = SchemaFactory.createForClass(ItemSchemaClass);

// Indexes để tối ưu query
ItemSchema.index({ apiName: 1 });
ItemSchema.index({ name: 1 });
ItemSchema.index({ tags: 1 });
ItemSchema.index({ unique: 1 });
ItemSchema.index({ disabled: 1 });

