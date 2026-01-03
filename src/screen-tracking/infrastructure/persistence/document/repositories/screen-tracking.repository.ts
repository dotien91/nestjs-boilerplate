import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { ScreenTracking } from '../../../../domain/screen-tracking';
import { ScreenTrackingRepository } from '../../screen-tracking.repository';
import { ScreenTrackingSchemaClass } from '../entities/screen-tracking.schema';
import { ScreenTrackingMapper } from '../mappers/screen-tracking.mapper';

@Injectable()
export class ScreenTrackingDocumentRepository
  implements ScreenTrackingRepository
{
  constructor(
    @InjectModel(ScreenTrackingSchemaClass.name)
    private readonly screenTrackingModel: Model<ScreenTrackingSchemaClass>,
  ) {}

  /**
   * Convert lean MongoDB object to ScreenTracking domain entity
   */
  private leanToDomain(trackingObject: any): ScreenTracking {
    const domainEntity = new ScreenTracking();
    domainEntity.id = trackingObject._id?.toString() || trackingObject._id;
    domainEntity.userId = trackingObject.userId || null;
    domainEntity.screenName = trackingObject.screenName;
    domainEntity.screenPath = trackingObject.screenPath;
    domainEntity.metadata = trackingObject.metadata || null;
    domainEntity.createdAt = trackingObject.createdAt;
    domainEntity.updatedAt = trackingObject.updatedAt;
    domainEntity.deletedAt = trackingObject.deletedAt;
    return domainEntity;
  }

  async create(data: ScreenTracking): Promise<ScreenTracking> {
    const persistenceModel = ScreenTrackingMapper.toPersistence(data);
    const createdTracking = new this.screenTrackingModel(persistenceModel);
    const trackingObject = await createdTracking.save();
    return ScreenTrackingMapper.toDomain(trackingObject);
  }

  async findById(id: ScreenTracking['id']): Promise<NullableType<ScreenTracking>> {
    const trackingObject = await this.screenTrackingModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .lean()
      .exec();

    if (!trackingObject) {
      return null;
    }

    return this.leanToDomain(trackingObject);
  }
}

