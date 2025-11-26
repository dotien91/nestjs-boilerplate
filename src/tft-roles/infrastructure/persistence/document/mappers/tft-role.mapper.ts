import { TftRole } from '../../../../domain/tft-role';
import { TftRoleSchemaClass } from '../entities/tft-role.schema';

export class TftRoleMapper {
  static toDomain(raw: TftRoleSchemaClass): TftRole {
    const domainEntity = new TftRole();
    domainEntity.id = raw._id.toString();
    domainEntity.apiName = raw.apiName;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.items = raw.items || [];
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: TftRole): TftRoleSchemaClass {
    const persistenceSchema = new TftRoleSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.apiName = domainEntity.apiName;
    persistenceSchema.name = domainEntity.name;
    persistenceSchema.description = domainEntity.description;
    persistenceSchema.items = domainEntity.items || [];
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

