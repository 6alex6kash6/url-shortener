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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlController = void 0;
const common_1 = require("@nestjs/common");
const url_service_1 = require("./url.service");
const create_url_dto_1 = require("../dto/create-url.dto");
let UrlController = class UrlController {
    constructor(urlService) {
        this.urlService = urlService;
    }
    async createShortUrl(createUrlDto) {
        const url = await this.urlService.createShortUrl(createUrlDto);
        return {
            shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${url.shortUrl}`,
            originalUrl: url.originalUrl,
        };
    }
    async getAllUrls() {
        return this.urlService.getAllUrls();
    }
    async getUrlInfo(shortUrl) {
        return this.urlService.getUrlInfo(shortUrl);
    }
    async deleteUrl(shortUrl) {
        await this.urlService.deleteUrl(shortUrl);
    }
    async getAnalytics(shortUrl) {
        return this.urlService.getAnalytics(shortUrl);
    }
    async redirect(shortUrl, ipAddress) {
        const originalUrl = await this.urlService.getOriginalUrl(shortUrl);
        await this.urlService.incrementClickCount(shortUrl, ipAddress);
        return { url: originalUrl };
    }
};
exports.UrlController = UrlController;
__decorate([
    (0, common_1.Post)('shorten'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_url_dto_1.CreateUrlDto]),
    __metadata("design:returntype", Promise)
], UrlController.prototype, "createShortUrl", null);
__decorate([
    (0, common_1.Get)('api/urls'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UrlController.prototype, "getAllUrls", null);
__decorate([
    (0, common_1.Get)('info/:shortUrl'),
    __param(0, (0, common_1.Param)('shortUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UrlController.prototype, "getUrlInfo", null);
__decorate([
    (0, common_1.Delete)('delete/:shortUrl'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('shortUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UrlController.prototype, "deleteUrl", null);
__decorate([
    (0, common_1.Get)('analytics/:shortUrl'),
    __param(0, (0, common_1.Param)('shortUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UrlController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)(':shortUrl'),
    (0, common_1.Redirect)(),
    __param(0, (0, common_1.Param)('shortUrl')),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UrlController.prototype, "redirect", null);
exports.UrlController = UrlController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [url_service_1.UrlService])
], UrlController);
//# sourceMappingURL=url.controller.js.map