import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Feedback } from '../../../../domain/feedback';
import { FeedbackRepository } from '../../feedback.repository';
import { FeedbackSchemaClass } from '../entities/feedback.schema';
import { FeedbackMapper } from '../mappers/feedback.mapper';

@Injectable()
export class FeedbackDocumentRepository implements FeedbackRepository {
  constructor(
    @InjectModel(FeedbackSchemaClass.name)
    private readonly feedbackModel: Model<FeedbackSchemaClass>,
  ) {}

  /**
   * Convert lean MongoDB object to Feedback domain entity
   */
  private leanToDomain(feedbackObject: any): Feedback {
    const domainEntity = new Feedback();
    domainEntity.id = feedbackObject._id?.toString() || feedbackObject._id;
    domainEntity.userId = feedbackObject.userId || null;
    domainEntity.content = feedbackObject.content;
    domainEntity.rating = feedbackObject.rating || null;
    domainEntity.category = feedbackObject.category || null;
    domainEntity.email = feedbackObject.email || null;
    domainEntity.createdAt = feedbackObject.createdAt;
    domainEntity.updatedAt = feedbackObject.updatedAt;
    domainEntity.deletedAt = feedbackObject.deletedAt;
    return domainEntity;
  }

  async create(data: Feedback): Promise<Feedback> {
    const persistenceModel = FeedbackMapper.toPersistence(data);
    const createdFeedback = new this.feedbackModel(persistenceModel);
    const feedbackObject = await createdFeedback.save();
    return FeedbackMapper.toDomain(feedbackObject);
  }

  async findById(id: Feedback['id']): Promise<NullableType<Feedback>> {
    const feedbackObject = await this.feedbackModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .lean()
      .exec();

    if (!feedbackObject) {
      return null;
    }

    return this.leanToDomain(feedbackObject);
  }
}

