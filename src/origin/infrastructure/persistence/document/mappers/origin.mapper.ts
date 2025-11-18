import { Origin } from '../../../../domain/origin';
import {
  OriginSchemaClass,
  OriginEffectSchemaClass,
} from '../entities/origin.schema';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';
import { FileMapper } from '../../../../../files/infrastructure/persistence/document/mappers/file.mapper';

export class OriginMapper {
  static toDomain(raw: OriginSchemaClass): Origin {
    const domainEntity = new Origin();
    domainEntity.id = raw._id.toString();
    domainEntity.apiName = raw.apiName;
    domainEntity.name = raw.name;
    domainEntity.trait = raw.trait;
    domainEntity.trait_name = raw.trait_name;
    domainEntity.description = raw.description;

    // Map effects
    if (raw.effects && raw.effects.length > 0) {
      domainEntity.effects = raw.effects.map((effect) => ({
        minUnits: effect.minUnits,
        maxUnits: effect.maxUnits,
        style: effect.style,
        effect: effect.effect,
      }));
    }

    domainEntity.img_name = raw.img_name;
    domainEntity.trait_img = raw.trait_img;
    domainEntity.description_fixed = raw.description_fixed;

    if (raw.icon) {
      domainEntity.icon = FileMapper.toDomain(raw.icon);
    } else if (raw.icon === null) {
      domainEntity.icon = null;
    }

    domainEntity.champions = raw.champions;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Origin): Partial<OriginSchemaClass> {
    const persistenceSchema: Partial<OriginSchemaClass> = {};

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id as any;
    }

    persistenceSchema.apiName = domainEntity.apiName;
    persistenceSchema.name = domainEntity.name;
    persistenceSchema.trait = domainEntity.trait;
    persistenceSchema.trait_name = domainEntity.trait_name;
    persistenceSchema.description = domainEntity.description;

    // Map effects
    if (domainEntity.effects && domainEntity.effects.length > 0) {
      persistenceSchema.effects = domainEntity.effects.map((effect) => {
        const effectSchema = new OriginEffectSchemaClass();
        effectSchema.minUnits = effect.minUnits;
        effectSchema.maxUnits = effect.maxUnits;
        effectSchema.style = effect.style;
        effectSchema.effect = effect.effect;
        return effectSchema;
      });
    }

    persistenceSchema.img_name = domainEntity.img_name;
    persistenceSchema.trait_img = domainEntity.trait_img;
    persistenceSchema.description_fixed = domainEntity.description_fixed;

    if (domainEntity.icon) {
      const iconSchema = new FileSchemaClass();
      iconSchema._id = domainEntity.icon.id as any;
      iconSchema.path = domainEntity.icon.path;
      persistenceSchema.icon = iconSchema;
    } else if (domainEntity.icon === null) {
      persistenceSchema.icon = null;
    }

    persistenceSchema.champions = domainEntity.champions;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}
