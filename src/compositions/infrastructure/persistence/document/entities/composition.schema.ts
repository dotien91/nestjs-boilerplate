import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type CompositionSchemaDocument = HydratedDocument<CompositionSchemaClass>;

// Schema cho BoardSize
@Schema({ _id: false })
export class BoardSizeSchemaClass {
  @Prop({ required: true, type: Number })
  rows: number;

  @Prop({ required: true, type: Number })
  cols: number;
}

export const BoardSizeSchema = SchemaFactory.createForClass(BoardSizeSchemaClass);


// Schema cho Position
@Schema({ _id: false })
export class PositionSchemaClass {
  @Prop({ required: true, type: Number })
  row: number;

  @Prop({ required: true, type: Number })
  col: number;
}

export const PositionSchema = SchemaFactory.createForClass(PositionSchemaClass);

// Schema cho Unit
@Schema({ _id: false })
export class UnitSchemaClass {
  @Prop({ required: true, type: String })
  championId: string;

  @Prop({ required: true, type: String })
  championKey: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  cost: number;

  @Prop({ required: true, type: Number })
  star: number;

  @Prop({ type: Boolean, default: false })
  carry?: boolean;

  @Prop({ type: Boolean, default: false })
  need3Star?: boolean;

  @Prop({ type: Boolean, default: false })
  needUnlock?: boolean;

  @Prop({ required: true, type: PositionSchemaClass })
  position: PositionSchemaClass;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop({ type: [String], default: [] })
  items?: string[];

  @Prop({ type: [String], default: [] })
  traits?: string[];

  @Prop({ type: Number, default: null })
  tier?: number | null;
}

export const UnitSchema = SchemaFactory.createForClass(UnitSchemaClass);

// Schema cho CarryItem
@Schema({ _id: false })
export class CarryItemSchemaClass {
  @Prop({ required: true, type: String })
  championId: string;

  @Prop({ required: true, type: String })
  championKey: string;

  @Prop({ required: true, type: String })
  championName: string;

  @Prop({ required: true, type: String })
  role: string;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop({ required: true, type: [String] })
  items: string[];
}

export const CarryItemSchema = SchemaFactory.createForClass(CarryItemSchemaClass);

// Schema cho Augment
@Schema({ _id: false })
export class AugmentSchemaClass {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  tier: number; // 1, 2, hoặc 3
}

export const AugmentSchema = SchemaFactory.createForClass(AugmentSchemaClass);

// Schema cho Composition
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class CompositionSchemaClass extends EntityDocumentHelper {
  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  compId: string;

  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    type: String,
    default: null,
  })
  plan?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  difficulty?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  metaDescription?: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  isLateGame?: boolean;

  @Prop({
    type: String,
    default: null,
  })
  tier?: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  active?: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isOp?: boolean;

  @Prop({
    required: true,
    type: BoardSizeSchemaClass,
  })
  boardSize: BoardSizeSchemaClass;


  @Prop({
    required: true,
    type: [UnitSchemaClass],
    default: [],
  })
  units: UnitSchemaClass[];

  @Prop({
    type: [UnitSchemaClass],
    default: [],
  })
  earlyGame?: UnitSchemaClass[];

  @Prop({
    type: [UnitSchemaClass],
    default: [],
  })
  midGame?: UnitSchemaClass[];

  @Prop({
    type: [UnitSchemaClass],
    default: [],
  })
  bench?: UnitSchemaClass[];

  @Prop({
    type: [CarryItemSchemaClass],
    default: [],
  })
  carryItems?: CarryItemSchemaClass[];

  @Prop({
    type: [String],
    default: [],
  })
  notes?: string[];

  @Prop({
    type: Number,
    default: null,
  })
  carouselPriority?: number | null;

  @Prop({
    type: [AugmentSchemaClass],
    default: [],
  })
  augments?: AugmentSchemaClass[];

  @Prop({
    type: UnitSchemaClass,
    default: null,
  })
  coreChampion?: UnitSchemaClass | null;

  @Prop({
    type: String,
    default: null,
  })
  teamcode?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const CompositionSchema = SchemaFactory.createForClass(CompositionSchemaClass);

// Indexes
CompositionSchema.index({ compId: 1 });
CompositionSchema.index({ name: 1 });
CompositionSchema.index({ difficulty: 1 });
CompositionSchema.index({ isLateGame: 1 });
CompositionSchema.index({ active: 1 });
CompositionSchema.index({ isOp: 1 });

