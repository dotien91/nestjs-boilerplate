import { Injectable } from '@nestjs/common';
import { CreateScreenTrackingDto } from './dto/create-screen-tracking.dto';
import { ScreenTrackingRepository } from './infrastructure/persistence/screen-tracking.repository';
import { ScreenTracking } from './domain/screen-tracking';

@Injectable()
export class ScreenTrackingService {
  constructor(
    private readonly screenTrackingRepository: ScreenTrackingRepository,
  ) {}

  async create(
    createScreenTrackingDto: CreateScreenTrackingDto & { userId?: string | null },
  ): Promise<ScreenTracking> {
    const tracking = new ScreenTracking();
    tracking.userId = createScreenTrackingDto.userId || null;
    tracking.screenName = createScreenTrackingDto.screenName;
    tracking.screenPath = `/${createScreenTrackingDto.screenName}`; // Tự tạo từ screenName
    tracking.metadata = null;
    tracking.createdAt = new Date();
    tracking.updatedAt = new Date();

    const createdTracking = await this.screenTrackingRepository.create(tracking);

    return createdTracking;
  }
}

