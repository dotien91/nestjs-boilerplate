import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type ScreenTrackingSchemaDocument =
  HydratedDocument<ScreenTrackingSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ScreenTrackingSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
    default: null,
  })
  userId?: string | null;

  @Prop({
    required: true,
    type: String,
  })
  screenName: string;

  @Prop({
    required: true,
    type: String,
  })
  screenPath: string;

  @Prop({
    type: Object,
    default: null,
  })
  metadata?: Record<string, any> | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const ScreenTrackingSchema = SchemaFactory.createForClass(
  ScreenTrackingSchemaClass,
);

// Indexes
ScreenTrackingSchema.index({ userId: 1 });
ScreenTrackingSchema.index({ screenName: 1 });
ScreenTrackingSchema.index({ screenPath: 1 });
ScreenTrackingSchema.index({ createdAt: -1 });
ScreenTrackingSchema.index({ userId: 1, screenName: 1 });
ScreenTrackingSchema.index({ userId: 1, createdAt: -1 });

