import { Composition } from '../../../../domain/composition';
import {
  CompositionSchemaClass,
  BoardSizeSchemaClass,
  SynergySchemaClass,
  PositionSchemaClass,
  UnitSchemaClass,
  CarryItemSchemaClass,
} from '../entities/composition.schema';

export class CompositionMapper {
  static toDomain(raw: CompositionSchemaClass): Composition {
    const domainEntity = new Composition();
    domainEntity.id = raw._id.toString();
    domainEntity.compId = raw.compId;
    domainEntity.name = raw.name;
    domainEntity.plan = raw.plan ?? undefined;
    domainEntity.difficulty = raw.difficulty ?? undefined;
    domainEntity.metaDescription = raw.metaDescription ?? undefined;
    domainEntity.isLateGame = raw.isLateGame ?? false;
    domainEntity.tier = raw.tier ?? undefined;

    // Map boardSize - always include
    domainEntity.boardSize = raw.boardSize
      ? {
          rows: raw.boardSize.rows,
          cols: raw.boardSize.cols,
        }
      : { rows: 4, cols: 7 }; // Default fallback

    // Map synergies - always include as array
    domainEntity.synergies =
      raw.synergies && raw.synergies.length > 0
        ? raw.synergies.map((synergy) => ({
            id: synergy.id,
            name: synergy.name,
            abbreviation: synergy.abbreviation,
            count: synergy.count,
            max: synergy.max,
            color: synergy.color,
          }))
        : [];

    // Map units - always include as array
    domainEntity.units =
      raw.units && raw.units.length > 0
        ? raw.units.map((unit) => ({
            championId: unit.championId,
            championKey: unit.championKey,
            name: unit.name,
            cost: unit.cost,
            star: unit.star,
            carry: unit.carry ?? false,
            need3Star: unit.need3Star ?? false,
            position: {
              row: unit.position.row,
              col: unit.position.col,
            },
            image: unit.image ?? undefined,
            items: unit.items || [],
          }))
        : [];

    // Map bench - always include as array (even if empty)
    domainEntity.bench =
      raw.bench && raw.bench.length > 0
        ? raw.bench.map((unit) => ({
            championId: unit.championId,
            championKey: unit.championKey,
            name: unit.name,
            cost: unit.cost,
            star: unit.star,
            carry: unit.carry ?? false,
            need3Star: unit.need3Star ?? false,
            position: {
              row: unit.position.row,
              col: unit.position.col,
            },
            image: unit.image ?? undefined,
            items: unit.items || [],
          }))
        : [];

    // Map carryItems - always include as array (even if empty)
    domainEntity.carryItems =
      raw.carryItems && raw.carryItems.length > 0
        ? raw.carryItems.map((carryItem) => ({
            championId: carryItem.championId,
            championKey: carryItem.championKey,
            championName: carryItem.championName,
            role: carryItem.role,
            image: carryItem.image ?? undefined,
            items: carryItem.items || [],
          }))
        : [];

    // Map notes - always include as array
    domainEntity.notes = raw.notes || [];

    // Always include timestamps
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: Composition,
  ): Partial<CompositionSchemaClass> {
    const persistenceSchema: Partial<CompositionSchemaClass> = {};

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id as any;
    }

    persistenceSchema.compId = domainEntity.compId;
    persistenceSchema.name = domainEntity.name;
    persistenceSchema.plan = domainEntity.plan;
    persistenceSchema.difficulty = domainEntity.difficulty;
    persistenceSchema.metaDescription = domainEntity.metaDescription;
    persistenceSchema.isLateGame = domainEntity.isLateGame;
    persistenceSchema.tier = domainEntity.tier;

    // Map boardSize
    if (domainEntity.boardSize) {
      const boardSizeSchema = new BoardSizeSchemaClass();
      boardSizeSchema.rows = domainEntity.boardSize.rows;
      boardSizeSchema.cols = domainEntity.boardSize.cols;
      persistenceSchema.boardSize = boardSizeSchema;
    }

    // Map synergies
    if (domainEntity.synergies && domainEntity.synergies.length > 0) {
      persistenceSchema.synergies = domainEntity.synergies.map((synergy) => {
        const synergySchema = new SynergySchemaClass();
        synergySchema.id = synergy.id;
        synergySchema.name = synergy.name;
        synergySchema.abbreviation = synergy.abbreviation;
        synergySchema.count = synergy.count;
        synergySchema.max = synergy.max;
        synergySchema.color = synergy.color;
        return synergySchema;
      });
    }

    // Map units
    if (domainEntity.units && domainEntity.units.length > 0) {
      persistenceSchema.units = domainEntity.units.map((unit) => {
        const unitSchema = new UnitSchemaClass();
        unitSchema.championId = unit.championId;
        unitSchema.championKey = unit.championKey;
        unitSchema.name = unit.name;
        unitSchema.cost = unit.cost;
        unitSchema.star = unit.star;
        unitSchema.carry = unit.carry;
        unitSchema.need3Star = unit.need3Star;
        const positionSchema = new PositionSchemaClass();
        positionSchema.row = unit.position.row;
        positionSchema.col = unit.position.col;
        unitSchema.position = positionSchema;
        unitSchema.image = unit.image;
        unitSchema.items = unit.items || [];
        return unitSchema;
      });
    }

    // Map bench
    if (domainEntity.bench && domainEntity.bench.length > 0) {
      persistenceSchema.bench = domainEntity.bench.map((unit) => {
        const unitSchema = new UnitSchemaClass();
        unitSchema.championId = unit.championId;
        unitSchema.championKey = unit.championKey;
        unitSchema.name = unit.name;
        unitSchema.cost = unit.cost;
        unitSchema.star = unit.star;
        unitSchema.carry = unit.carry;
        unitSchema.need3Star = unit.need3Star;
        const positionSchema = new PositionSchemaClass();
        positionSchema.row = unit.position.row;
        positionSchema.col = unit.position.col;
        unitSchema.position = positionSchema;
        unitSchema.image = unit.image;
        unitSchema.items = unit.items || [];
        return unitSchema;
      });
    }

    // Map carryItems
    if (domainEntity.carryItems && domainEntity.carryItems.length > 0) {
      persistenceSchema.carryItems = domainEntity.carryItems.map((carryItem) => {
        const carryItemSchema = new CarryItemSchemaClass();
        carryItemSchema.championId = carryItem.championId;
        carryItemSchema.championKey = carryItem.championKey;
        carryItemSchema.championName = carryItem.championName;
        carryItemSchema.role = carryItem.role;
        carryItemSchema.image = carryItem.image;
        carryItemSchema.items = carryItem.items || [];
        return carryItemSchema;
      });
    }

    // Map notes
    persistenceSchema.notes = domainEntity.notes || [];

    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

