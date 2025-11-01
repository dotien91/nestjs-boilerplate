import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';
import { TraitType } from '../../../../domain/trait';

export type TraitSchemaDocument = HydratedDocument<TraitSchemaClass>;

// Schema cho Trait Tier (mốc kích hoạt)
@Schema({ _id: false })
export class TraitTierSchemaClass {
  @Prop({ required: true, type: Number })
  count: number;

  @Prop({ required: true, type: String })
  effect: string;
}

export const TraitTierSchema =
  SchemaFactory.createForClass(TraitTierSchemaClass);

// Schema cho Trait
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TraitSchemaClass extends EntityDocumentHelper {
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
    enum: Object.values(TraitType),
  })
  type: TraitType;

  @Prop({
    type: String,
    default: null,
  })
  description?: string | null;

  @Prop({
    type: [TraitTierSchema],
    default: null,
  })
  tiers?: TraitTierSchemaClass[] | null;

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

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TraitSchema = SchemaFactory.createForClass(TraitSchemaClass);

// Indexes
TraitSchema.index({ key: 1 });
TraitSchema.index({ type: 1 });
TraitSchema.index({ set: 1 });
TraitSchema.index({ isActive: 1 });
