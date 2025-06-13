import { EntityManager } from '@mikro-orm/core';
import { Url } from '../entities/url.entity';
import { CreateUrlDto } from '../dto/create-url.dto';
export declare class UrlService {
    private readonly em;
    constructor(em: EntityManager);
    createShortUrl(createUrlDto: CreateUrlDto): Promise<Url>;
    getAllUrls(): Promise<any[]>;
    getOriginalUrl(shortUrl: string): Promise<string>;
    incrementClickCount(shortUrl: string, ipAddress: string): Promise<void>;
    getUrlInfo(shortUrl: string): Promise<any>;
    deleteUrl(shortUrl: string): Promise<void>;
    getAnalytics(shortUrl: string): Promise<any>;
}
