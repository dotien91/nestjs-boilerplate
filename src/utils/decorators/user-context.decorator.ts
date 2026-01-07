import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  lang?: string;
  location?: string;
}

/**
 * Decorator để lấy lang và location từ request headers
 * Usage: @UserContext() userContext: UserContext
 * hoặc: @UserContext('lang') lang: string
 * 
 * Headers được sử dụng:
 * - x-lang cho language
 * - x-location cho location
 */
export const UserContext = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    // Lấy lang từ header x-lang
    const lang = headers['x-lang'] || undefined;
    
    // Lấy location từ header
    const location = headers['x-location'] || undefined;

    const userContext: UserContext = {
      lang,
      location,
    };

    // Nếu chỉ cần một field cụ thể
    if (data) {
      return userContext[data];
    }

    return userContext;
  },
);

