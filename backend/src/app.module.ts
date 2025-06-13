import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UrlModule } from './url/url.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    UrlModule,
  ],
})
export class AppModule {}