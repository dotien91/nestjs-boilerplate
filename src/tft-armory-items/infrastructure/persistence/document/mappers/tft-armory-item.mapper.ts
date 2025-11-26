import { TftArmoryItem } from '../../../../domain/tft-armory-item';
import { TftArmoryItemSchemaClass } from '../entities/tft-armory-item.schema';

export class TftArmoryItemMapper {
  static toDomain(raw: TftArmoryItemSchemaClass): TftArmoryItem {
    const domainEntity = new TftArmoryItem();
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
    domainEntity.itemId = raw.itemId;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: TftArmoryItem,
  ): TftArmoryItemSchemaClass {
    const persistenceSchema = new TftArmoryItemSchemaClass();

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
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

