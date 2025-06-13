"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const url_service_1 = require("./url.service");
const nestjs_1 = require("@mikro-orm/nestjs");
const url_entity_1 = require("../entities/url.entity");
const click_analytics_entity_1 = require("../entities/click-analytics.entity");
describe('UrlService', () => {
    let service;
    let urlRepository;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                url_service_1.UrlService,
                {
                    provide: (0, nestjs_1.getRepositoryToken)(url_entity_1.Url),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        persistAndFlush: jest.fn(),
                    },
                },
                {
                    provide: (0, nestjs_1.getRepositoryToken)(click_analytics_entity_1.ClickAnalytics),
                    useValue: {
                        create: jest.fn(),
                        persistAndFlush: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(url_service_1.UrlService);
        urlRepository = module.get((0, nestjs_1.getRepositoryToken)(url_entity_1.Url));
    });
    it('should create a short URL with unique alias', async () => {
        const createUrlDto = {
            originalUrl: 'https://example.com',
            alias: 'myalias',
        };
        urlRepository.findOne.mockResolvedValue(null);
        urlRepository.create.mockReturnValue({ ...createUrlDto, shortUrl: 'myalias' });
        const result = await service.createShortUrl(createUrlDto);
        expect(urlRepository.findOne).toHaveBeenCalledWith({ alias: 'myalias' });
        expect(urlRepository.create).toHaveBeenCalled();
        expect(urlRepository.persistAndFlush).toHaveBeenCalled();
    });
    it('should redirect to original URL', async () => {
        const mockUrl = {
            originalUrl: 'https://example.com',
            expiresAt: null,
        };
        urlRepository.findOne.mockResolvedValue(mockUrl);
        const result = await service.getOriginalUrl('shortcode');
        expect(result).toBe('https://example.com');
    });
});
//# sourceMappingURL=url.service.spec.js.map