import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';

export type ChampionSchemaDocument = HydratedDocument<ChampionSchemaClass>;

// Schema cho Champion
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ChampionSchemaClass extends EntityDocumentHelper {
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
    type: Number,
    min: 1,
    max: 5,
  })
  cost: number;

  @Prop({
    type: String,
    default: null,
  })
  abilityDescription?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  abilityName?: string | null;

  @Prop({
    type: Number,
    default: null,
  })
  health?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  armor?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  magicResist?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  attackDamage?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  attackSpeed?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  attackRange?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  startingMana?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  maxMana?: number | null;

  @Prop({
    type: FileSchemaClass,
    default: null,
  })
  image?: FileSchemaClass | null;

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
  origins?: string[];

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const ChampionSchema = SchemaFactory.createForClass(ChampionSchemaClass);

// Indexes để tối ưu query
ChampionSchema.index({ key: 1 });
ChampionSchema.index({ cost: 1 });
ChampionSchema.index({ set: 1 });
ChampionSchema.index({ isActive: 1 });
