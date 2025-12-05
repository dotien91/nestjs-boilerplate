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

// Schema cho Synergy
@Schema({ _id: false })
export class SynergySchemaClass {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  abbreviation: string;

  @Prop({ required: true, type: Number })
  count: number;

  @Prop({ required: true, type: Number })
  max: number;

  @Prop({ required: true, type: String })
  color: string;
}

export const SynergySchema = SchemaFactory.createForClass(SynergySchemaClass);

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

  @Prop({ required: true, type: PositionSchemaClass })
  position: PositionSchemaClass;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop({ type: [String], default: [] })
  items?: string[];
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
    required: true,
    type: BoardSizeSchemaClass,
  })
  boardSize: BoardSizeSchemaClass;

  @Prop({
    required: true,
    type: [SynergySchemaClass],
    default: [],
  })
  synergies: SynergySchemaClass[];

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

