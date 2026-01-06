import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './database/mongoose-config.service';
import { CompositionsModule } from './compositions/compositions.module';
import { TftItemsModule } from './tft-items/tft-items.module';
import { TftAugmentsModule } from './tft-augments/tft-augments.module';
import { TftTraitsModule } from './tft-traits/tft-traits.module';
import { TftArmoryItemsModule } from './tft-armory-items/tft-armory-items.module';
import { TftAugmentOddsModule } from './tft-augment-odds/tft-augment-odds.module';
import { TftRolesModule } from './tft-roles/tft-roles.module';
import { TftUnitsModule } from './tft-units/tft-units.module';
import { DataModule } from './data/data.module';
import { ScreenTrackingModule } from './screen-tracking/screen-tracking.module';
import { FeedbackModule } from './feedback/feedback.module';

const infrastructureDatabaseModule = MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, mailConfig, fileConfig],
      envFilePath: ['.env'],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 0, // Cache đến khi server restart (0 = không expire)
      max: 1000, // Maximum số items trong cache
    }),
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    CompositionsModule,
    TftItemsModule,
    TftAugmentsModule,
    TftTraitsModule,
    TftArmoryItemsModule,
    TftAugmentOddsModule,
    TftRolesModule,
    TftUnitsModule,
    DataModule,
    ScreenTrackingModule,
    FeedbackModule,
  ],
})
export class AppModule {}
