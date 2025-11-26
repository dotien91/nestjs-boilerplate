import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TftTraitSchemaDocument = HydratedDocument<TftTraitSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TftTraitSchemaClass extends EntityDocumentHelper {
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
    type: [
      {
        maxUnits: { type: Number },
        minUnits: { type: Number },
        style: { type: Number },
        variables: { type: MongooseSchema.Types.Mixed },
        variableMatches: {
          type: [
            {
              match: { type: String, required: true },
              type: { type: String },
              multiplier: { type: String },
              full_match: { type: String, required: true },
              hash: { type: String },
              value: { type: MongooseSchema.Types.Mixed },
            },
          ],
          default: [],
        },
      },
    ],
    default: [],
  })
  effects?: Array<{
    maxUnits?: number;
    minUnits?: number;
    style?: number;
    variables?: Record<string, any>;
    variableMatches?: Array<{
      match: string;
      type?: string;
      multiplier?: string;
      full_match: string;
      hash?: string;
      value: number | string | null;
    }>;
  }>;

  @Prop({
    type: [
      {
        unit: { type: String, required: true },
        unit_cost: { type: Number },
      },
    ],
    default: [],
  })
  units?: Array<{
    unit: string;
    unit_cost?: number;
  }>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  unitProperties?: Record<string, any>;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TftTraitSchema = SchemaFactory.createForClass(TftTraitSchemaClass);

// Indexes để tối ưu query
TftTraitSchema.index({ apiName: 1 });
TftTraitSchema.index({ name: 1 });

