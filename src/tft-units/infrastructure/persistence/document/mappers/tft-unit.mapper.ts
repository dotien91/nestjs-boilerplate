import { TftUnit } from '../../../../domain/tft-unit';
import { TftUnitSchemaClass } from '../entities/tft-unit.schema';

export class TftUnitMapper {
  static toDomain(raw: TftUnitSchemaClass): TftUnit {
    const domainEntity = new TftUnit();
    domainEntity.id = raw._id.toString();
    domainEntity.apiName = raw.apiName;
    domainEntity.name = raw.name;
    domainEntity.enName = raw.enName;
    domainEntity.characterName = raw.characterName;
    domainEntity.cost = raw.cost;
    domainEntity.icon = raw.icon;
    domainEntity.squareIcon = raw.squareIcon;
    domainEntity.tileIcon = raw.tileIcon;
    domainEntity.role = raw.role;
    domainEntity.ability = raw.ability;
    domainEntity.stats = raw.stats;
    domainEntity.traits = raw.traits || [];
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: TftUnit): TftUnitSchemaClass {
    const persistenceSchema = new TftUnitSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.apiName = domainEntity.apiName;
    persistenceSchema.name = domainEntity.name;
    persistenceSchema.enName = domainEntity.enName;
    persistenceSchema.characterName = domainEntity.characterName;
    persistenceSchema.cost = domainEntity.cost;
    persistenceSchema.icon = domainEntity.icon;
    persistenceSchema.squareIcon = domainEntity.squareIcon;
    persistenceSchema.tileIcon = domainEntity.tileIcon;
    persistenceSchema.role = domainEntity.role;
    persistenceSchema.ability = domainEntity.ability;
    persistenceSchema.stats = domainEntity.stats;
    persistenceSchema.traits = domainEntity.traits || [];
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

