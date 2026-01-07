import { ScreenTracking } from '../../../../domain/screen-tracking';
import { ScreenTrackingSchemaClass } from '../entities/screen-tracking.schema';

export class ScreenTrackingMapper {
  static toDomain(raw: ScreenTrackingSchemaClass): ScreenTracking {
    const domainEntity = new ScreenTracking();
    domainEntity.id = raw._id.toString();
    domainEntity.userId = raw.userId || null;
    domainEntity.screenName = raw.screenName;
    domainEntity.screenPath = raw.screenPath;
    domainEntity.lang = raw.lang || null;
    domainEntity.location = raw.location || null;
    domainEntity.metadata = raw.metadata || null;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: ScreenTracking): ScreenTrackingSchemaClass {
    const persistenceSchema = new ScreenTrackingSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.userId = domainEntity.userId || null;
    persistenceSchema.screenName = domainEntity.screenName;
    persistenceSchema.screenPath = domainEntity.screenPath;
    persistenceSchema.lang = domainEntity.lang || null;
    persistenceSchema.location = domainEntity.location || null;
    persistenceSchema.metadata = domainEntity.metadata || null;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

