"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@mikro-orm/core");
const url_entity_1 = require("../entities/url.entity");
const click_analytics_entity_1 = require("../entities/click-analytics.entity");
function generateShortUrl(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
let UrlService = class UrlService {
    constructor(em) {
        this.em = em;
    }
    async createShortUrl(createUrlDto) {
        const { originalUrl, expiresAt, alias } = createUrlDto;
        if (alias) {
            const existing = await this.em.findOne(url_entity_1.Url, { alias });
            if (existing) {
                throw new common_1.BadRequestException('Alias already exists');
            }
        }
        const shortUrl = alias || generateShortUrl(8);
        const url = this.em.create(url_entity_1.Url, {
            originalUrl,
            shortUrl,
            alias,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });
        await this.em.persistAndFlush(url);
        return url;
    }
    async getAllUrls() {
        const urls = await this.em.find(url_entity_1.Url, {}, {
            orderBy: { createdAt: 'DESC' },
            limit: 50
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
    async getOriginalUrl(shortUrl) {
        const url = await this.em.findOne(url_entity_1.Url, {
            $or: [{ shortUrl }, { alias: shortUrl }]
        });
        if (!url) {
            throw new common_1.NotFoundException('Short URL not found');
        }
        if (url.expiresAt && url.expiresAt < new Date()) {
            throw new common_1.NotFoundException('Short URL has expired');
        }
        return url.originalUrl;
    }
    async incrementClickCount(shortUrl, ipAddress) {
        const url = await this.em.findOne(url_entity_1.Url, {
            $or: [{ shortUrl }, { alias: shortUrl }]
        });
        if (!url)
            return;
        url.clickCount++;
        const analytics = this.em.create(click_analytics_entity_1.ClickAnalytics, {
            url,
            ipAddress,
        });
        await this.em.persistAndFlush(analytics);
        await this.em.flush();
    }
    async getUrlInfo(shortUrl) {
        const url = await this.em.findOne(url_entity_1.Url, {
            $or: [{ shortUrl }, { alias: shortUrl }]
        });
        if (!url) {
            throw new common_1.NotFoundException('Short URL not found');
        }
        return {
            originalUrl: url.originalUrl,
            createdAt: url.createdAt,
            clickCount: url.clickCount,
            shortUrl: url.shortUrl,
            expiresAt: url.expiresAt,
        };
    }
    async deleteUrl(shortUrl) {
        const url = await this.em.findOne(url_entity_1.Url, {
            $or: [{ shortUrl }, { alias: shortUrl }]
        });
        if (!url) {
            throw new common_1.NotFoundException('Short URL not found');
        }
        await this.em.nativeDelete(click_analytics_entity_1.ClickAnalytics, { url: url.id });
        await this.em.removeAndFlush(url);
    }
    async getAnalytics(shortUrl) {
        const url = await this.em.findOne(url_entity_1.Url, {
            $or: [{ shortUrl }, { alias: shortUrl }]
        });
        if (!url) {
            throw new common_1.NotFoundException('Short URL not found');
        }
        const recentClicks = await this.em.find(click_analytics_entity_1.ClickAnalytics, { url }, { orderBy: { clickedAt: 'DESC' }, limit: 5 });
        return {
            clickCount: url.clickCount,
            lastIpAddresses: recentClicks.map(click => click.ipAddress),
        };
    }
};
exports.UrlService = UrlService;
exports.UrlService = UrlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.EntityManager])
], UrlService);
//# sourceMappingURL=url.service.js.map