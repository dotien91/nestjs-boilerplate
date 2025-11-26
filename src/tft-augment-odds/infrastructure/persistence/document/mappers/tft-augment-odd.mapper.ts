import { TftAugmentOdd } from '../../../../domain/tft-augment-odd';
import { TftAugmentOddSchemaClass } from '../entities/tft-augment-odd.schema';

export class TftAugmentOddMapper {
  static toDomain(raw: TftAugmentOddSchemaClass): TftAugmentOdd {
    const domainEntity = new TftAugmentOdd();
    domainEntity.id = raw._id.toString();
    domainEntity.odds = raw.odds;
    domainEntity.augments = raw.augments;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: TftAugmentOdd,
  ): TftAugmentOddSchemaClass {
    const persistenceSchema = new TftAugmentOddSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.odds = domainEntity.odds;
    persistenceSchema.augments = domainEntity.augments;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

