import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';

export type OriginSchemaDocument = HydratedDocument<OriginSchemaClass>;

// Schema cho Origin Effect (mốc kích hoạt)
@Schema({ _id: false })
export class OriginEffectSchemaClass {
  @Prop({ required: true, type: Number })
  minUnits: number;

  @Prop({ required: true, type: Number })
  maxUnits: number;

  @Prop({ required: true, type: String })
  style: string; // bronze, silver, gold

  @Prop({ type: String, default: '' })
  effect: string;
}

export const OriginEffectSchema = SchemaFactory.createForClass(
  OriginEffectSchemaClass,
);

// Schema cho Origin
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class OriginSchemaClass extends EntityDocumentHelper {
  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  apiName: string;

  @Prop({
    type: String,
    default: null,
  })
  key?: string | null;

  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    type: String,
    default: null,
  })
  type?: string | null;

  @Prop({
    type: [Number],
    default: null,
  })
  tiers?: number[] | null;

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

  @Prop({
    required: true,
    type: String,
  })
  trait: string;

  @Prop({
    required: true,
    type: String,
  })
  trait_name: string;

  @Prop({
    type: String,
    default: null,
  })
  description?: string | null;

  @Prop({
    type: [OriginEffectSchema],
    default: null,
  })
  effects?: OriginEffectSchemaClass[] | null;

  @Prop({
    type: String,
    default: null,
  })
  img_name?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  trait_img?: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  description_fixed?: boolean;

  @Prop({
    type: FileSchemaClass,
    default: null,
  })
  icon?: FileSchemaClass | null;

  @Prop({
    type: [String],
    default: [],
  })
  champions?: string[];

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const OriginSchema = SchemaFactory.createForClass(OriginSchemaClass);

// Indexes
OriginSchema.index({ apiName: 1 });
OriginSchema.index({ key: 1 });
OriginSchema.index({ trait: 1 });
OriginSchema.index({ trait_name: 1 });
OriginSchema.index({ type: 1 });
OriginSchema.index({ set: 1 });
