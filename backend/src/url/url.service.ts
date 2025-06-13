import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Url } from '../entities/url.entity';
import { ClickAnalytics } from '../entities/click-analytics.entity';
import { CreateUrlDto } from '../dto/create-url.dto';
// Simple random string generator as replacement for nanoid
function generateShortUrl(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class UrlService {
  constructor(
    private readonly em: EntityManager,
  ) {}

  async createShortUrl(createUrlDto: CreateUrlDto): Promise<Url> {
    const { originalUrl, expiresAt, alias } = createUrlDto;

    // Check if alias already exists
    if (alias) {
      const existing = await this.em.findOne(Url, { alias });
      if (existing) {
        throw new BadRequestException('Alias already exists');
      }
    }

    const shortUrl = alias || generateShortUrl(8);
    const url = this.em.create(Url, {
      originalUrl,
      shortUrl,
      alias,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await this.em.persistAndFlush(url);
    return url;
  }

  async getAllUrls(): Promise<any[]> {
    const urls = await this.em.find(Url, {}, { 
      orderBy: { createdAt: 'DESC' },
      limit: 50 // Limit to recent 50 URLs
    });

    return urls.map(url => ({
      shortUrl: url.shortUrl,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      clickCount: url.clickCount,
      expiresAt: url.expiresAt,
      alias: url.alias,
    }));
  }

  async getOriginalUrl(shortUrl: string): Promise<string> {
    const url = await this.em.findOne(Url, {
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      throw new NotFoundException('Short URL has expired');
    }

    return url.originalUrl;
  }

  async incrementClickCount(shortUrl: string, ipAddress: string): Promise<void> {
    const url = await this.em.findOne(Url, {
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) return;

    url.clickCount++;

    const analytics = this.em.create(ClickAnalytics, {
      url,
      ipAddress,
    });

    await this.em.persistAndFlush(analytics);
    await this.em.flush();
  }

  async getUrlInfo(shortUrl: string): Promise<any> {
    const url = await this.em.findOne(Url, {
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    return {
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      clickCount: url.clickCount,
      shortUrl: url.shortUrl,
      expiresAt: url.expiresAt,
    };
  }

  async deleteUrl(shortUrl: string): Promise<void> {
    const url = await this.em.findOne(Url, {
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    // First delete associated analytics
    await this.em.nativeDelete(ClickAnalytics, { url: url.id });
    
    // Then delete the URL
    await this.em.removeAndFlush(url);
  }

  async getAnalytics(shortUrl: string): Promise<any> {
    const url = await this.em.findOne(Url, {
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    const recentClicks = await this.em.find(ClickAnalytics,
      { url },
      { orderBy: { clickedAt: 'DESC' }, limit: 5 }
    );

    return {
      clickCount: url.clickCount,
      lastIpAddresses: recentClicks.map(click => click.ipAddress),
    };
  }
}