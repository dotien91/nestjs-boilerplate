import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  lang?: string;
  location?: string;
  deviceId?: string;
  appVersion?: string;
}

/**
 * Decorator để lấy lang, location, device_id, app_version từ request headers
 * Usage: @UserContext() userContext: UserContext
 * hoặc: @UserContext('lang') lang: string
 *
 * Headers được sử dụng:
 * - x-lang cho language
 * - x-location cho location
 * - x-device-id cho device_id
 * - x-app-version cho app_version
 */
export const UserContext = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    const lang = headers['x-lang'] || undefined;
    const location = headers['x-location'] || undefined;
    const deviceId = headers['x-device-id'] || undefined;
    const appVersion = headers['x-app-version'] || undefined;

    const userContext: UserContext = {
      lang,
      location,
      deviceId,
      appVersion,
    };

    // Nếu chỉ cần một field cụ thể
    if (data) {
      return userContext[data];
    }

    return userContext;
  },
);

