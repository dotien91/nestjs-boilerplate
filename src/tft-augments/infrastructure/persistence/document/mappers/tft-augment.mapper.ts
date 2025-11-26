import { TftAugment } from '../../../../domain/tft-augment';
import { TftAugmentSchemaClass } from '../entities/tft-augment.schema';

export class TftAugmentMapper {
  static toDomain(raw: TftAugmentSchemaClass): TftAugment {
    const domainEntity = new TftAugment();
    domainEntity.id = raw._id.toString();
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
    domainEntity.augmentId = raw.augmentId;
    domainEntity.disabled = raw.disabled ?? false;
    domainEntity.type = raw.type;
    domainEntity.texture = raw.texture;
    domainEntity.variableMatches = raw.variableMatches || [];
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: TftAugment): TftAugmentSchemaClass {
    const persistenceSchema = new TftAugmentSchemaClass();

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
    persistenceSchema.augmentId = domainEntity.augmentId;
    persistenceSchema.disabled = domainEntity.disabled ?? false;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.texture = domainEntity.texture;
    persistenceSchema.variableMatches = domainEntity.variableMatches || [];
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

