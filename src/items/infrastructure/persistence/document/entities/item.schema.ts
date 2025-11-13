import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type ItemSchemaDocument = HydratedDocument<ItemSchemaClass>;

// Schema cho Item
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
    required: true,
    type: String,
  })
  description: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  effects: Record<string, any>;

  @Prop({
    type: [String],
    default: [],
  })
  composition: string[];

  @Prop({
    type: [String],
    default: [],
  })
  associatedTraits: string[];

  @Prop({
    type: [String],
    default: [],
  })
  incompatibleTraits: string[];

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    type: Boolean,
    default: false,
  })
  unique: boolean;

  @Prop({
    required: true,
    type: String,
  })
  icon: string;

  @Prop({
    type: [
      {
        match: { type: String, required: true },
        type: { type: String, required: true },
        full_match: { type: String, required: true },
        hash: { type: String, required: true },
        value: { type: Number, required: true },
      },
    ],
    default: [],
  })
  variableMatches?: Array<{
    match: string;
    type: string;
    full_match: string;
    hash: string;
    value: number;
  }> | null;

  @Prop({
    type: String,
    default: null,
  })
  set?: string | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive?: boolean;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const ItemSchema = SchemaFactory.createForClass(ItemSchemaClass);

// Indexes để tối ưu query
ItemSchema.index({ apiName: 1 });
ItemSchema.index({ name: 1 });
ItemSchema.index({ set: 1 });
ItemSchema.index({ isActive: 1 });
ItemSchema.index({ 'associatedTraits': 1 });
ItemSchema.index({ 'tags': 1 });
