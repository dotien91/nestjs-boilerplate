import { Injectable } from '@nestjs/common';
import { Item } from '../../../../domain/item';
import { ItemSchemaClass, ItemSchemaDocument } from '../entities/item.schema';

@Injectable()
export class ItemMapper {
  toDomain(persistence: ItemSchemaDocument): Item {
    return {
      id: persistence._id.toString(),
      apiName: persistence.apiName,
      name: persistence.name,
      enName: persistence.enName,
      description: persistence.description,
      effects: persistence.effects,
      composition: persistence.composition,
      associatedTraits: persistence.associatedTraits,
      incompatibleTraits: persistence.incompatibleTraits,
      tags: persistence.tags,
      unique: persistence.unique,
      icon: persistence.icon,
      variableMatches: persistence.variableMatches,
      set: persistence.set,
      isActive: persistence.isActive,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
      deletedAt: persistence.deletedAt,
    };
  }

  toPersistence(domain: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Partial<ItemSchemaClass> {
    return {
      apiName: domain.apiName,
      name: domain.name,
      enName: domain.enName,
      description: domain.description,
      effects: domain.effects,
      composition: domain.composition,
      associatedTraits: domain.associatedTraits,
      incompatibleTraits: domain.incompatibleTraits,
      tags: domain.tags,
      unique: domain.unique,
      icon: domain.icon,
      variableMatches: domain.variableMatches,
      set: domain.set,
      isActive: domain.isActive,
    };
  }
}
