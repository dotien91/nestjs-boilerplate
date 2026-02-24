import { Composition } from '../../../../domain/composition';
import {
  CompositionSchemaClass,
  BoardSizeSchemaClass,
  PositionSchemaClass,
  UnitSchemaClass,
  CarryItemSchemaClass,
  AugmentSchemaClass,
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
    domainEntity.active = raw.active ?? false;
    domainEntity.isOp = raw.isOp ?? false;

    // Map boardSize - always include
    domainEntity.boardSize = raw.boardSize
      ? {
          rows: raw.boardSize.rows,
          cols: raw.boardSize.cols,
        }
      : { rows: 4, cols: 7 }; // Default fallback


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
            needUnlock: unit.needUnlock ?? false,
            need3Star: unit.need3Star ?? false,
            position: {
              row: unit.position.row,
              col: unit.position.col,
            },
            image: unit.image ?? undefined,
            items: unit.items || [],
            traits: unit.traits || [],
            tier: unit.tier ?? undefined,
          }))
        : [];

    // Map earlyGame - always include as array (even if empty)
    domainEntity.earlyGame =
      raw.earlyGame && raw.earlyGame.length > 0
        ? raw.earlyGame.map((unit) => ({
            championId: unit.championId,
            championKey: unit.championKey,
            name: unit.name,
            cost: unit.cost,
            star: unit.star,
            carry: unit.carry ?? false,
            needUnlock: unit.needUnlock ?? false,
            need3Star: unit.need3Star ?? false,
            position: {
              row: unit.position.row,
              col: unit.position.col,
            },
            image: unit.image ?? undefined,
            items: unit.items || [],
            traits: unit.traits || [],
            tier: unit.tier ?? undefined,
          }))
        : [];

    // Map midGame - always include as array (even if empty)
    domainEntity.midGame =
      raw.midGame && raw.midGame.length > 0
        ? raw.midGame.map((unit) => ({
            championId: unit.championId,
            championKey: unit.championKey,
            name: unit.name,
            cost: unit.cost,
            star: unit.star,
            carry: unit.carry ?? false,
            needUnlock: unit.needUnlock ?? false,
            need3Star: unit.need3Star ?? false,
            position: {
              row: unit.position.row,
              col: unit.position.col,
            },
            image: unit.image ?? undefined,
            items: unit.items || [],
            traits: unit.traits || [],
            tier: unit.tier ?? undefined,
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
            needUnlock: unit.needUnlock ?? false,
            need3Star: unit.need3Star ?? false,
            position: {
              row: unit.position.row,
              col: unit.position.col,
            },
            image: unit.image ?? undefined,
            items: unit.items || [],
            traits: unit.traits || [],
            tier: unit.tier ?? undefined,
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

    // Map carouselPriority
    domainEntity.carouselPriority = raw.carouselPriority ?? undefined;

    // Map augments - always include as array
    domainEntity.augments =
      raw.augments && raw.augments.length > 0
        ? raw.augments.map((augment) => ({
            name: augment.name,
            tier: augment.tier,
          }))
        : [];

    // Map coreChampion - map từ UnitSchemaClass sang Unit
    if (raw.coreChampion) {
      domainEntity.coreChampion = {
        championId: raw.coreChampion.championId,
        championKey: raw.coreChampion.championKey,
        name: raw.coreChampion.name,
        cost: raw.coreChampion.cost,
        star: raw.coreChampion.star,
        carry: raw.coreChampion.carry ?? false,
        needUnlock: raw.coreChampion.needUnlock ?? false,
        need3Star: raw.coreChampion.need3Star ?? false,
        position: {
          row: raw.coreChampion.position.row,
          col: raw.coreChampion.position.col,
        },
        image: raw.coreChampion.image ?? undefined,
        items: raw.coreChampion.items || [],
        traits: raw.coreChampion.traits || [],
        tier: raw.coreChampion.tier ?? undefined,
      };
    } else {
      domainEntity.coreChampion = undefined;
    }

    // Map teamCode (DB field: teamcode)
    domainEntity.teamCode = raw.teamcode ?? undefined;

    domainEntity.order = raw.order ?? undefined;

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
    persistenceSchema.active = domainEntity.active;
    persistenceSchema.isOp = domainEntity.isOp ?? false;

    // Map boardSize
    if (domainEntity.boardSize) {
      const boardSizeSchema = new BoardSizeSchemaClass();
      boardSizeSchema.rows = domainEntity.boardSize.rows;
      boardSizeSchema.cols = domainEntity.boardSize.cols;
      persistenceSchema.boardSize = boardSizeSchema;
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
        unitSchema.needUnlock = unit.needUnlock ?? false;
        unitSchema.need3Star = unit.need3Star;
        const positionSchema = new PositionSchemaClass();
        positionSchema.row = unit.position.row;
        positionSchema.col = unit.position.col;
        unitSchema.position = positionSchema;
        unitSchema.image = unit.image;
        unitSchema.items = unit.items || [];
        unitSchema.traits = unit.traits || [];
        unitSchema.tier = unit.tier;
        return unitSchema;
      });
    }

    // Map earlyGame
    if (domainEntity.earlyGame && domainEntity.earlyGame.length > 0) {
      persistenceSchema.earlyGame = domainEntity.earlyGame.map((unit) => {
        const unitSchema = new UnitSchemaClass();
        unitSchema.championId = unit.championId;
        unitSchema.championKey = unit.championKey;
        unitSchema.name = unit.name;
        unitSchema.cost = unit.cost;
        unitSchema.star = unit.star;
        unitSchema.carry = unit.carry;
        unitSchema.needUnlock = unit.needUnlock ?? false;
        unitSchema.need3Star = unit.need3Star;
        const positionSchema = new PositionSchemaClass();
        positionSchema.row = unit.position.row;
        positionSchema.col = unit.position.col;
        unitSchema.position = positionSchema;
        unitSchema.image = unit.image;
        unitSchema.items = unit.items || [];
        unitSchema.traits = unit.traits || [];
        unitSchema.tier = unit.tier;
        return unitSchema;
      });
    }

    // Map midGame
    if (domainEntity.midGame && domainEntity.midGame.length > 0) {
      persistenceSchema.midGame = domainEntity.midGame.map((unit) => {
        const unitSchema = new UnitSchemaClass();
        unitSchema.championId = unit.championId;
        unitSchema.championKey = unit.championKey;
        unitSchema.name = unit.name;
        unitSchema.cost = unit.cost;
        unitSchema.star = unit.star;
        unitSchema.carry = unit.carry;
        unitSchema.needUnlock = unit.needUnlock ?? false;
        unitSchema.need3Star = unit.need3Star;
        const positionSchema = new PositionSchemaClass();
        positionSchema.row = unit.position.row;
        positionSchema.col = unit.position.col;
        unitSchema.position = positionSchema;
        unitSchema.image = unit.image;
        unitSchema.items = unit.items || [];
        unitSchema.traits = unit.traits || [];
        unitSchema.tier = unit.tier;
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
        unitSchema.needUnlock = unit.needUnlock ?? false;
        unitSchema.need3Star = unit.need3Star;
        const positionSchema = new PositionSchemaClass();
        positionSchema.row = unit.position.row;
        positionSchema.col = unit.position.col;
        unitSchema.position = positionSchema;
        unitSchema.image = unit.image;
        unitSchema.items = unit.items || [];
        unitSchema.traits = unit.traits || [];
        unitSchema.tier = unit.tier;
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

    // Map carouselPriority
    persistenceSchema.carouselPriority = domainEntity.carouselPriority;

    // Map augments
    if (domainEntity.augments && domainEntity.augments.length > 0) {
      persistenceSchema.augments = domainEntity.augments.map((augment) => {
        const augmentSchema = new AugmentSchemaClass();
        augmentSchema.name = augment.name;
        augmentSchema.tier = augment.tier;
        return augmentSchema;
      });
    } else {
      persistenceSchema.augments = [];
    }

    // Map coreChampion - map từ Unit sang UnitSchemaClass
    if (domainEntity.coreChampion) {
      const coreChampionSchema = new UnitSchemaClass();
      coreChampionSchema.championId = domainEntity.coreChampion.championId;
      coreChampionSchema.championKey = domainEntity.coreChampion.championKey;
      coreChampionSchema.name = domainEntity.coreChampion.name;
      coreChampionSchema.cost = domainEntity.coreChampion.cost;
      coreChampionSchema.star = domainEntity.coreChampion.star;
      coreChampionSchema.carry = domainEntity.coreChampion.carry;
      coreChampionSchema.needUnlock = domainEntity.coreChampion.needUnlock ?? false;
      coreChampionSchema.need3Star = domainEntity.coreChampion.need3Star;
      const positionSchema = new PositionSchemaClass();
      positionSchema.row = domainEntity.coreChampion.position.row;
      positionSchema.col = domainEntity.coreChampion.position.col;
      coreChampionSchema.position = positionSchema;
      coreChampionSchema.image = domainEntity.coreChampion.image;
      coreChampionSchema.items = domainEntity.coreChampion.items || [];
      coreChampionSchema.traits = domainEntity.coreChampion.traits || [];
      coreChampionSchema.tier = domainEntity.coreChampion.tier;
      persistenceSchema.coreChampion = coreChampionSchema;
    } else {
      persistenceSchema.coreChampion = null;
    }

    // Map teamCode -> teamcode (DB field)
    persistenceSchema.teamcode = domainEntity.teamCode ?? null;

    persistenceSchema.order = domainEntity.order ?? null;

    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

