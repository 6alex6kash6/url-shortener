import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Url } from '../entities/url.entity';
import { ClickAnalytics } from '../entities/click-analytics.entity';

describe('UrlService', () => {
  let service: UrlService;
  let urlRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getRepositoryToken(Url),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            persistAndFlush: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClickAnalytics),
          useValue: {
            create: jest.fn(),
            persistAndFlush: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    urlRepository = module.get(getRepositoryToken(Url));
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