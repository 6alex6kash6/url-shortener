import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { Url } from '../entities/url.entity';
import { ClickAnalytics } from '../entities/click-analytics.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Url, ClickAnalytics])],
  controllers: [UrlController],
  providers: [UrlService],
})
export class UrlModule {}