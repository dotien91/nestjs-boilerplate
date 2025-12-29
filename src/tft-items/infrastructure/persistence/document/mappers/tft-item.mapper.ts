import { TftItem } from '../../../../domain/tft-item';
import { TftItemSchemaClass } from '../entities/tft-item.schema';

export class TftItemMapper {
  static toDomain(raw: TftItemSchemaClass | any): TftItem {
    const domainEntity = new TftItem();
    // Handle both Mongoose document and plain object from aggregation
    const id = raw._id ? (raw._id.toString ? raw._id.toString() : raw._id) : raw.id;
    domainEntity.id = id;
    domainEntity.apiName = raw.apiName;
    domainEntity.name = raw.name;
    domainEntity.enName = raw.enName;
    domainEntity.desc = raw.desc;
    domainEntity.icon = raw.icon;
    domainEntity.associatedTraits = raw.associatedTraits || [];
    domainEntity.incompatibleTraits = raw.incompatibleTraits || [];
    domainEntity.composition = raw.composition || [];
    domainEntity.effects = raw.effects || {};
    domainEntity.tags = raw.tags || [];
    domainEntity.unique = raw.unique ?? false;
    domainEntity.from = raw.from;
    domainEntity.itemId = raw.itemId;
    domainEntity.disabled = raw.disabled ?? false;
    domainEntity.type = raw.type;
    domainEntity.texture = raw.texture;
    domainEntity.tier = raw.tier;
    domainEntity.variableMatches = raw.variableMatches || [];
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: TftItem): TftItemSchemaClass {
    const persistenceSchema = new TftItemSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.apiName = domainEntity.apiName;
    persistenceSchema.name = domainEntity.name;
    persistenceSchema.enName = domainEntity.enName;
    persistenceSchema.desc = domainEntity.desc;
    persistenceSchema.icon = domainEntity.icon;
    persistenceSchema.associatedTraits = domainEntity.associatedTraits || [];
    persistenceSchema.incompatibleTraits =
      domainEntity.incompatibleTraits || [];
    persistenceSchema.composition = domainEntity.composition || [];
    persistenceSchema.effects = domainEntity.effects || {};
    persistenceSchema.tags = domainEntity.tags || [];
    persistenceSchema.unique = domainEntity.unique ?? false;
    persistenceSchema.from = domainEntity.from;
    persistenceSchema.itemId = domainEntity.itemId;
    persistenceSchema.disabled = domainEntity.disabled ?? false;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.texture = domainEntity.texture;
    persistenceSchema.tier = domainEntity.tier;
    persistenceSchema.variableMatches = domainEntity.variableMatches || [];
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

