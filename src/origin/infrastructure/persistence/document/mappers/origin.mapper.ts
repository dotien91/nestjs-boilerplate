import { Origin } from '../../../../domain/origin';
import {
  OriginSchemaClass,
  OriginTierSchemaClass,
} from '../entities/origin.schema';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';
import { FileMapper } from '../../../../../files/infrastructure/persistence/document/mappers/file.mapper';

export class OriginMapper {
  static toDomain(raw: OriginSchemaClass): Origin {
    const domainEntity = new Origin();
    domainEntity.id = raw._id.toString();
    domainEntity.name = raw.name;
    domainEntity.key = raw.key;
    domainEntity.type = raw.type;
    domainEntity.description = raw.description;

    // Map tiers
    if (raw.tiers && raw.tiers.length > 0) {
      domainEntity.tiers = raw.tiers.map((tier) => ({
        count: tier.count,
        effect: tier.effect,
      }));
    }

    if (raw.icon) {
      domainEntity.icon = FileMapper.toDomain(raw.icon);
    } else if (raw.icon === null) {
      domainEntity.icon = null;
    }

    domainEntity.set = raw.set;
    domainEntity.isActive = raw.isActive;
    domainEntity.champions = raw.champions;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Origin): OriginSchemaClass {
    const persistenceSchema = new OriginSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.name = domainEntity.name;
    persistenceSchema.key = domainEntity.key;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.description = domainEntity.description;

    // Map tiers
    if (domainEntity.tiers && domainEntity.tiers.length > 0) {
      persistenceSchema.tiers = domainEntity.tiers.map((tier) => {
        const tierSchema = new OriginTierSchemaClass();
        tierSchema.count = tier.count;
        tierSchema.effect = tier.effect;
        return tierSchema;
      });
    }

    if (domainEntity.icon) {
      const iconSchema = new FileSchemaClass();
      iconSchema._id = domainEntity.icon.id;
      iconSchema.path = domainEntity.icon.path;
      persistenceSchema.icon = iconSchema;
    } else if (domainEntity.icon === null) {
      persistenceSchema.icon = null;
    }

    persistenceSchema.set = domainEntity.set;
    persistenceSchema.isActive = domainEntity.isActive;
    persistenceSchema.champions = domainEntity.champions;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}
