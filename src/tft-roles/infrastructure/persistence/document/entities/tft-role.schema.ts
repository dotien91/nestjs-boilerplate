import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TftRoleSchemaDocument = HydratedDocument<TftRoleSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TftRoleSchemaClass extends EntityDocumentHelper {
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
  description?: string | null;

  @Prop({
    type: [String],
    default: [],
  })
  items?: string[];

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TftRoleSchema = SchemaFactory.createForClass(TftRoleSchemaClass);

// Indexes để tối ưu query
TftRoleSchema.index({ apiName: 1 });
TftRoleSchema.index({ name: 1 });

