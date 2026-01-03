import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type FeedbackSchemaDocument = HydratedDocument<FeedbackSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class FeedbackSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
    default: null,
  })
  userId?: string | null;

  @Prop({
    required: true,
    type: String,
  })
  content: string;

  @Prop({
    type: Number,
    default: null,
    min: 1,
    max: 5,
  })
  rating?: number | null;

  @Prop({
    type: String,
    default: null,
  })
  category?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  email?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(FeedbackSchemaClass);

// Indexes
FeedbackSchema.index({ userId: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ email: 1 });

