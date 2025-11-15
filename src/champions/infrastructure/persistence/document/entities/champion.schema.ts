import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
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
    type: String,
    default: null,
  })
  apiName?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  characterName?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  enName?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  role?: string | null;

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
    type: Number,
    default: null,
  })
  critChance?: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  critMultiplier?: number | null;

  @Prop({
    type: String,
    default: null,
  })
  abilityIcon?: string | null;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        value: {
          type: MongooseSchema.Types.Mixed,
          required: true,
        },
      },
    ],
    default: [],
  })
  abilityVariables?: Array<{
    name: string;
    value: number | [number, number, number];
  }> | null;

  @Prop({
    type: FileSchemaClass,
    default: null,
  })
  image?: FileSchemaClass | null;

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

  @Prop({
    type: {
      Primary: { type: String, default: null },
      Secondary: { type: String, default: null },
      Weight: { type: Number, default: null },
      MaxLevel: { type: Number, default: null },
      MinLevel: { type: Number, default: null },
      MaxStage: { type: Number, default: null },
      MinStage: { type: Number, default: null },
      IsPVEAllowed: { type: Boolean, default: null },
      IsChampion: { type: Boolean, default: null },
      IsCommon: { type: Boolean, default: null },
      AllowMultiple: { type: Boolean, default: null },
      IsTrait: { type: Boolean, default: null },
      IsWeird: { type: Boolean, default: null },
      IsDuo: { type: Boolean, default: null },
      TraitLevel: { type: Number, default: null },
    },
    default: null,
    _id: false,
  })
  set15Mechanic?: {
    Primary?: string | null;
    Secondary?: string | null;
    Weight?: number | null;
    MaxLevel?: number | null;
    MinLevel?: number | null;
    MaxStage?: number | null;
    MinStage?: number | null;
    IsPVEAllowed?: boolean | null;
    IsChampion?: boolean | null;
    IsCommon?: boolean | null;
    AllowMultiple?: boolean | null;
    IsTrait?: boolean | null;
    IsWeird?: boolean | null;
    IsDuo?: boolean | null;
    TraitLevel?: number | null;
  } | null;

  @Prop({
    type: {
      Primary: { type: String, default: null },
      Secondary: { type: String, default: null },
      Weight: { type: Number, default: null },
      MaxLevel: { type: Number, default: null },
      MinLevel: { type: Number, default: null },
      MaxStage: { type: Number, default: null },
      MinStage: { type: Number, default: null },
      IsPVEAllowed: { type: Boolean, default: null },
      IsChampion: { type: Boolean, default: null },
      IsCommon: { type: Boolean, default: null },
      AllowMultiple: { type: Boolean, default: null },
      IsTrait: { type: Boolean, default: null },
      IsWeird: { type: Boolean, default: null },
      IsDuo: { type: Boolean, default: null },
      TraitLevel: { type: Number, default: null },
    },
    default: null,
    _id: false,
  })
  set15MechanicHero?: {
    Primary?: string | null;
    Secondary?: string | null;
    Weight?: number | null;
    MaxLevel?: number | null;
    MinLevel?: number | null;
    MaxStage?: number | null;
    MinStage?: number | null;
    IsPVEAllowed?: boolean | null;
    IsChampion?: boolean | null;
    IsCommon?: boolean | null;
    AllowMultiple?: boolean | null;
    IsTrait?: boolean | null;
    IsWeird?: boolean | null;
    IsDuo?: boolean | null;
    TraitLevel?: number | null;
  } | null;

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
