import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TftAugmentOddSchemaDocument =
  HydratedDocument<TftAugmentOddSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TftAugmentOddSchemaClass extends EntityDocumentHelper {
  @Prop({
    required: true,
    type: Number,
  })
  odds: number;

  @Prop({
    required: true,
    type: [String],
  })
  augments: string[];

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TftAugmentOddSchema = SchemaFactory.createForClass(
  TftAugmentOddSchemaClass,
);

