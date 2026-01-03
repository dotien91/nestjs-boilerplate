import { Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackRepository } from './infrastructure/persistence/feedback.repository';
import { Feedback } from './domain/feedback';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async create(
    createFeedbackDto: CreateFeedbackDto & { userId?: string | null },
  ): Promise<Feedback> {
    const feedback = new Feedback();
    feedback.userId = createFeedbackDto.userId || null;
    feedback.content = createFeedbackDto.content;
    feedback.rating = createFeedbackDto.rating || null;
    feedback.category = createFeedbackDto.category || null;
    feedback.email = createFeedbackDto.email || null;
    feedback.createdAt = new Date();
    feedback.updatedAt = new Date();

    const createdFeedback = await this.feedbackRepository.create(feedback);

    return createdFeedback;
  }
}

