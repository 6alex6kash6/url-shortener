import { UrlService } from './url.service';
import { CreateUrlDto } from '../dto/create-url.dto';
export declare class UrlController {
    private readonly urlService;
    constructor(urlService: UrlService);
    createShortUrl(createUrlDto: CreateUrlDto): Promise<{
        shortUrl: string;
        originalUrl: string;
    }>;
    getAllUrls(): Promise<any[]>;
    getUrlInfo(shortUrl: string): Promise<any>;
    deleteUrl(shortUrl: string): Promise<void>;
    getAnalytics(shortUrl: string): Promise<any>;
    redirect(shortUrl: string, ipAddress: string): Promise<{
        url: string;
    }>;
}
