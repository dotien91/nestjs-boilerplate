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
import { ScreenTrackingService } from './screen-tracking.service';
import { CreateScreenTrackingDto } from './dto/create-screen-tracking.dto';
import { ScreenTracking } from './domain/screen-tracking';
import { UserContext } from '../utils/decorators/user-context.decorator';

@ApiTags('Screen Tracking')
@Controller({
  path: 'screen-trackings',
  version: '1',
})
export class ScreenTrackingController {
  constructor(
    private readonly screenTrackingService: ScreenTrackingService,
  ) {}

  @ApiOperation({
    summary: 'Track khi user vào một màn hình',
    description:
      'API để track khi user vào một màn hình. Nếu có JWT token, userId sẽ được lấy tự động. Nếu không có token, userId có thể là null.',
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    type: ScreenTracking,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async trackScreen(
    @Body() createScreenTrackingDto: CreateScreenTrackingDto,
    @Request() request: any,
    @UserContext() userContext: {
      lang?: string;
      location?: string;
      deviceId?: string;
      appVersion?: string;
    },
  ): Promise<ScreenTracking> {
    const userId = request.user?.id || null;

    return this.screenTrackingService.create({
      ...createScreenTrackingDto,
      userId,
      lang: userContext?.lang || null,
      location: userContext?.location || null,
      deviceId: createScreenTrackingDto.deviceId ?? userContext?.deviceId ?? null,
      appVersion: createScreenTrackingDto.appVersion ?? userContext?.appVersion ?? null,
    });
  }
}

