import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';
import { OriginType } from '../../../../domain/origin';

export type OriginSchemaDocument = HydratedDocument<OriginSchemaClass>;

// Schema cho Origin Tier (mốc kích hoạt)
@Schema({ _id: false })
export class OriginTierSchemaClass {
  @Prop({ required: true, type: Number })
  count: number;

  @Prop({ required: true, type: String })
  effect: string;
}

export const OriginTierSchema = SchemaFactory.createForClass(
  OriginTierSchemaClass,
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
  })
  name: string;

  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  key: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(OriginType),
  })
  type: OriginType;

  @Prop({
    type: String,
    default: null,
  })
  description?: string | null;

  @Prop({
    type: [OriginTierSchema],
    default: null,
  })
  tiers?: OriginTierSchemaClass[] | null;

  @Prop({
    type: FileSchemaClass,
    default: null,
  })
  icon?: FileSchemaClass | null;

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
OriginSchema.index({ key: 1 });
OriginSchema.index({ type: 1 });
OriginSchema.index({ set: 1 });
OriginSchema.index({ isActive: 1 });
