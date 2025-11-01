import { Champion } from '../../../../domain/champion';
import { ChampionSchemaClass } from '../entities/champion.schema';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';
import { FileMapper } from '../../../../../files/infrastructure/persistence/document/mappers/file.mapper';

export class ChampionMapper {
  static toDomain(raw: ChampionSchemaClass): Champion {
    const domainEntity = new Champion();
    domainEntity.id = raw._id.toString();
    domainEntity.name = raw.name;
    domainEntity.key = raw.key;
    domainEntity.cost = raw.cost;
    domainEntity.abilityDescription = raw.abilityDescription;
    domainEntity.abilityName = raw.abilityName;

    domainEntity.health = raw.health;
    domainEntity.armor = raw.armor;
    domainEntity.magicResist = raw.magicResist;
    domainEntity.attackDamage = raw.attackDamage;
    domainEntity.attackSpeed = raw.attackSpeed;
    domainEntity.attackRange = raw.attackRange;
    domainEntity.startingMana = raw.startingMana;
    domainEntity.maxMana = raw.maxMana;

    if (raw.image) {
      domainEntity.image = FileMapper.toDomain(raw.image);
    } else if (raw.image === null) {
      domainEntity.image = null;
    }

    domainEntity.set = raw.set;
    domainEntity.isActive = raw.isActive;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Champion): ChampionSchemaClass {
    const persistenceSchema = new ChampionSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.name = domainEntity.name;
    persistenceSchema.key = domainEntity.key;
    persistenceSchema.cost = domainEntity.cost;
    persistenceSchema.abilityDescription = domainEntity.abilityDescription;
    persistenceSchema.abilityName = domainEntity.abilityName;

    persistenceSchema.health = domainEntity.health;
    persistenceSchema.armor = domainEntity.armor;
    persistenceSchema.magicResist = domainEntity.magicResist;
    persistenceSchema.attackDamage = domainEntity.attackDamage;
    persistenceSchema.attackSpeed = domainEntity.attackSpeed;
    persistenceSchema.attackRange = domainEntity.attackRange;
    persistenceSchema.startingMana = domainEntity.startingMana;
    persistenceSchema.maxMana = domainEntity.maxMana;

    if (domainEntity.image) {
      const imageSchema = new FileSchemaClass();
      imageSchema._id = domainEntity.image.id;
      imageSchema.path = domainEntity.image.path;
      persistenceSchema.image = imageSchema;
    } else if (domainEntity.image === null) {
      persistenceSchema.image = null;
    }

    persistenceSchema.set = domainEntity.set;
    persistenceSchema.isActive = domainEntity.isActive;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}
