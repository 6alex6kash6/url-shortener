import { Controller, Post, Get, Delete, Param, Body, Redirect, Ip, HttpCode } from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from '../dto/create-url.dto';

@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  async createShortUrl(@Body() createUrlDto: CreateUrlDto) {
    const url = await this.urlService.createShortUrl(createUrlDto);
    return {
      shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${url.shortUrl}`,
      originalUrl: url.originalUrl,
    };
  }

  @Get('api/urls')
  async getAllUrls() {
    return this.urlService.getAllUrls();
  }

  @Get('info/:shortUrl')
  async getUrlInfo(@Param('shortUrl') shortUrl: string) {
    return this.urlService.getUrlInfo(shortUrl);
  }

  @Delete('delete/:shortUrl')
  @HttpCode(204)
  async deleteUrl(@Param('shortUrl') shortUrl: string) {
    await this.urlService.deleteUrl(shortUrl);
  }

  @Get('analytics/:shortUrl')
  async getAnalytics(@Param('shortUrl') shortUrl: string) {
    return this.urlService.getAnalytics(shortUrl);
  }

  @Get(':shortUrl')
  @Redirect()
  async redirect(@Param('shortUrl') shortUrl: string, @Ip() ipAddress: string) {
    const originalUrl = await this.urlService.getOriginalUrl(shortUrl);
    await this.urlService.incrementClickCount(shortUrl, ipAddress);
    return { url: originalUrl };
  }
}