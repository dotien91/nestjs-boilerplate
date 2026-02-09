import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
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
import { ImagesModule } from './images/images.module';
import { CrawlerModule } from './crawler/crawler.module';

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
    ScheduleModule.forRoot(),
    infrastructureDatabaseModule,
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
    ImagesModule,
    CrawlerModule,
  ],
})
export class AppModule {}
