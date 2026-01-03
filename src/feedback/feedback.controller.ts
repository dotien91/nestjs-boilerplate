import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback } from './domain/feedback';

@ApiTags('Feedback')
@Controller({
  path: 'feedbacks',
  version: '1',
})
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiOperation({
    summary: 'Gửi feedback',
    description:
      'API để user gửi feedback. Nếu có JWT token, userId sẽ được lấy tự động. Nếu không có token, có thể cung cấp email.',
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    type: Feedback,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Request() request: any,
  ): Promise<Feedback> {
    // Lấy userId từ JWT token nếu có (user đã đăng nhập)
    // Nếu không có token, userId sẽ là null
    const userId = request.user?.id || null;

    return this.feedbackService.create({
      ...createFeedbackDto,
      userId,
    });
  }
}

