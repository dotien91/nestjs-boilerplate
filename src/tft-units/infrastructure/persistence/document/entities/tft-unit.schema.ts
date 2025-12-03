import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type TftUnitSchemaDocument = HydratedDocument<TftUnitSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class TftUnitSchemaClass extends EntityDocumentHelper {
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
  characterName?: string | null;

  @Prop({
    type: Number,
    default: null,
  })
  cost?: number | null;

  @Prop({
    type: String,
    default: null,
  })
  icon?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  squareIcon?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  tileIcon?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  role?: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  needUnlock?: boolean;

  @Prop({
    type: {
      desc: { type: String },
      icon: { type: String },
      name: { type: String },
      variables: {
        type: [
          {
            name: { type: String, required: true },
            value: { type: MongooseSchema.Types.Mixed, required: true },
          },
        ],
        default: [],
      },
      tooltipElements: { type: [MongooseSchema.Types.Mixed], default: [] },
      calculations: { type: MongooseSchema.Types.Mixed, default: {} },
    },
    default: null,
  })
  ability?: {
    desc?: string | null;
    icon?: string | null;
    name?: string | null;
    variables?: Array<{
      name: string;
      value: number | number[];
    }>;
    tooltipElements?: any[];
    calculations?: Record<string, any>;
  } | null;

  @Prop({
    type: {
      armor: { type: Number },
      attackSpeed: { type: Number },
      critChance: { type: Number },
      critMultiplier: { type: Number },
      damage: { type: Number },
      hp: { type: Number },
      initialMana: { type: Number },
      magicResist: { type: Number },
      mana: { type: Number },
      range: { type: Number },
    },
    default: null,
  })
  stats?: {
    armor?: number | null;
    attackSpeed?: number | null;
    critChance?: number | null;
    critMultiplier?: number | null;
    damage?: number | null;
    hp?: number | null;
    initialMana?: number | null;
    magicResist?: number | null;
    mana?: number | null;
    range?: number | null;
  } | null;

  @Prop({
    type: [String],
    default: [],
  })
  traits?: string[];

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const TftUnitSchema = SchemaFactory.createForClass(TftUnitSchemaClass);

// Indexes để tối ưu query
TftUnitSchema.index({ apiName: 1 });
TftUnitSchema.index({ name: 1 });
TftUnitSchema.index({ cost: 1 });
TftUnitSchema.index({ 'traits': 1 });
TftUnitSchema.index({ role: 1 });

