import { Feedback } from '../../../../domain/feedback';
import { FeedbackSchemaClass } from '../entities/feedback.schema';

export class FeedbackMapper {
  static toDomain(raw: FeedbackSchemaClass): Feedback {
    const domainEntity = new Feedback();
    domainEntity.id = raw._id.toString();
    domainEntity.userId = raw.userId || null;
    domainEntity.content = raw.content;
    domainEntity.rating = raw.rating || null;
    domainEntity.category = raw.category || null;
    domainEntity.email = raw.email || null;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Feedback): FeedbackSchemaClass {
    const persistenceSchema = new FeedbackSchemaClass();

    if (domainEntity.id && typeof domainEntity.id === 'string') {
      persistenceSchema._id = domainEntity.id;
    }

    persistenceSchema.userId = domainEntity.userId || null;
    persistenceSchema.content = domainEntity.content;
    persistenceSchema.rating = domainEntity.rating || null;
    persistenceSchema.category = domainEntity.category || null;
    persistenceSchema.email = domainEntity.email || null;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.deletedAt = domainEntity.deletedAt;

    return persistenceSchema;
  }
}

