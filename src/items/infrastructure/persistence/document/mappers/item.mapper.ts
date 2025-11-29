import { Item } from '../../../../domain/item';
import { ItemSchemaClass } from '../entities/item.schema';

export class ItemMapper {
  static toDomain(raw: ItemSchemaClass): Item {
    const domainEntity = new Item();
    domainEntity.id = raw._id.toString();
    domainEntity.name = raw.name;
    domainEntity.apiName = raw.apiName;
    domainEntity.enName = raw.enName;
    domainEntity.desc = raw.desc;
    domainEntity.icon = raw.icon;
    domainEntity.composition = raw.composition;
    domainEntity.associatedTraits = raw.associatedTraits;
    domainEntity.incompatibleTraits = raw.incompatibleTraits;
    domainEntity.tags = raw.tags;
    domainEntity.unique = raw.unique;
    domainEntity.disabled = raw.disabled;
    domainEntity.status = raw.status;
    // Deep clone effects để tránh circular reference
    domainEntity.effects = raw.effects ? JSON.parse(JSON.stringify(raw.effects)) : null;
    domainEntity.variableMatches = raw.variableMatches ? JSON.parse(JSON.stringify(raw.variableMatches)) : null;
    domainEntity.from = raw.from;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Item): ItemSchemaClass {
    const persistenceSchema = new ItemSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.name = domainEntity.name;
    persistenceSchema.apiName = domainEntity.apiName;
    persistenceSchema.enName = domainEntity.enName;
    persistenceSchema.desc = domainEntity.desc;
    persistenceSchema.icon = domainEntity.icon;
    persistenceSchema.composition = domainEntity.composition || [];
    persistenceSchema.associatedTraits = domainEntity.associatedTraits || [];
    persistenceSchema.incompatibleTraits = domainEntity.incompatibleTraits || [];
    persistenceSchema.tags = domainEntity.tags || [];
    persistenceSchema.unique = domainEntity.unique ?? false;
    persistenceSchema.disabled = domainEntity.disabled ?? false;
    persistenceSchema.status = domainEntity.status || 'active';
    persistenceSchema.effects = domainEntity.effects || {};
    persistenceSchema.variableMatches = domainEntity.variableMatches || [];
    persistenceSchema.from = domainEntity.from;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt ?? null;

    return persistenceSchema;
  }
}

