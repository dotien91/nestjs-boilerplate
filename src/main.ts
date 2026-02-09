import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { LoggingInterceptor } from './utils/interceptors/logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  
  // Serve static files for icons - đặt TRƯỚC global prefix
  // Sử dụng express.static trực tiếp để đảm bảo hoạt động
  const iconsPath = join(process.cwd(), 'src', 'asset', 'icons');
  app.use('/icons', express.static(iconsPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    },
  }));

  // Serve composition builder HTML
  const assetPath = join(process.cwd(), 'src', 'asset');
  app.use('/builder', express.static(assetPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));

  // Set global prefix sau
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/', '/images'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // LoggingInterceptor để log headers cho tất cả requests
    new LoggingInterceptor(),
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters(
      {
        in: 'header',
        required: false,
        name: 'x-lang',
        schema: {
          example: 'en',
        },
        description: 'Language code (e.g., en, vi, es)',
      },
      {
        in: 'header',
        required: false,
        name: process.env.APP_HEADER_LOCATION || 'x-location',
        schema: {
          example: 'US',
        },
        description: 'User location/country code (e.g., US, VN, ES)',
      },
      {
        in: 'header',
        required: false,
        name: 'x-device-id',
        schema: {
          example: 'device-uuid-xxx',
        },
        description: 'Device ID for tracking',
      },
      {
        in: 'header',
        required: false,
        name: 'x-app-version',
        schema: {
          example: '1.2.0',
        },
        description: 'App version for tracking',
      },
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui { background: #0d1117; color: #c9d1d9; }
      .swagger-ui .info { background: #161b22; color: #c9d1d9; border: none; border-radius: 6px; padding: 16px; margin-bottom: 24px; }
      .swagger-ui .info .title { color: #58a6ff; font-size: 32px; font-weight: 600; }
      .swagger-ui .info .description { color: #8b949e; }
      .swagger-ui .scheme-container { background: #161b22; border: none; border-radius: 6px; padding: 16px; }
      .swagger-ui .btn.authorize { background: #238636; color: #ffffff; border: none; border-radius: 6px; }
      .swagger-ui .btn.authorize:hover { background: #2ea043; }
      .swagger-ui .opblock { background: #161b22; border: none; border-radius: 6px; margin-bottom: 16px; }
      .swagger-ui .opblock.opblock-get { border-left: none; }
      .swagger-ui .opblock.opblock-post { border-left: none; }
      .swagger-ui .opblock.opblock-put { border-left: none; }
      .swagger-ui .opblock.opblock-delete { border-left: none; }
      .swagger-ui .opblock .opblock-summary { color: #c9d1d9; padding: 12px 16px; }
      .swagger-ui .opblock .opblock-summary:hover { background: #21262d; }
      .swagger-ui .opblock-body { background: #0d1117; border-top: none; }
      .swagger-ui .opblock-body pre { background: #161b22; color: #c9d1d9; border: none; border-radius: 6px; }
      .swagger-ui .parameter__name { color: #58a6ff; font-weight: 600; }
      .swagger-ui .parameter__type { color: #79c0ff; }
      .swagger-ui .response-col_status { color: #c9d1d9; }
      .swagger-ui .response-col_description { color: #8b949e; }
      .swagger-ui .model-box { background: #161b22; color: #c9d1d9; border: none; border-radius: 6px; }
      .swagger-ui .model-title { color: #58a6ff; }
      .swagger-ui .prop-name { color: #79c0ff; }
      .swagger-ui .prop-type { color: #a5d6ff; }
      .swagger-ui table thead tr th { background: #161b22; color: #c9d1d9; border-color: transparent; }
      .swagger-ui table tbody tr td { background: #0d1117; color: #c9d1d9; border-color: transparent; }
      .swagger-ui input { background: #0d1117; color: #c9d1d9; border: none; border-radius: 6px; }
      .swagger-ui select { background: #0d1117; color: #c9d1d9; border: none; border-radius: 6px; }
      .swagger-ui textarea { background: #0d1117; color: #c9d1d9; border: none; border-radius: 6px; }
      .swagger-ui .btn { background: #238636; color: #ffffff; border: none; border-radius: 6px; }
      .swagger-ui .btn:hover { background: #2ea043; }
      .swagger-ui .btn.cancel { background: #21262d; color: #c9d1d9; border: none; }
      .swagger-ui .btn.cancel:hover { background: #30363d; }
      .swagger-ui .response-col_links { color: #58a6ff; }
      .swagger-ui .tab li { background: #161b22; border: none; }
      .swagger-ui .tab li.active { background: #0d1117; border-bottom: none; }
      .swagger-ui .tab li button { color: #8b949e; }
      .swagger-ui .tab li.active button { color: #58a6ff; }
      .swagger-ui .loading-container { background: #0d1117; }
      .swagger-ui .loading:after { border-color: transparent transparent transparent; }
      .swagger-ui .opblock-tag { color: #c9d1d9; border-bottom: none; }
      .swagger-ui .opblock-tag:hover { color: #58a6ff; }
      .swagger-ui .opblock-tag-section { border-bottom: none; }
    `,
    customSiteTitle: 'API Documentation',
    customJs: `
      // Add Composition Builder link
      window.addEventListener('load', function() {
        const infoContainer = document.querySelector('.info');
        if (infoContainer) {
          const builderLink = document.createElement('div');
          builderLink.style.marginTop = '20px';
          builderLink.style.padding = '16px';
          builderLink.style.background = '#21262d';
          builderLink.style.borderRadius = '6px';
          builderLink.innerHTML = \`
            <h3 style="color: #58a6ff; margin-bottom: 10px;">🎮 Composition Builder</h3>
            <p style="color: #8b949e; margin-bottom: 15px;">Tạo đội hình TFT trực quan với UI builder</p>
            <a href="/builder/composition-builder.html" target="_blank" 
               style="display: inline-block; padding: 10px 20px; background: #238636; color: white; 
                      text-decoration: none; border-radius: 6px; font-weight: 600; transition: all 0.2s;"
               onmouseover="this.style.background='#2ea043'"
               onmouseout="this.style.background='#238636'">
              Mở Composition Builder →
            </a>
          \`;
          infoContainer.appendChild(builderLink);
        }
      });
    `,
  });

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
