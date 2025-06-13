# URL Shortener Project Development Guide

## Project Overview
Build a URL shortener service with REST API (NestJS) and React frontend, using TypeScript throughout, PostgreSQL with MikroORM, and Docker for containerization.

## Project Structure
```
url-shortener/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

## Phase 1: Backend Setup

### Step 1: Initialize Backend Project
1. Create backend directory and initialize NestJS project:
```bash
mkdir backend && cd backend
npx @nestjs/cli new . --package-manager npm
```
2. Choose npm as package manager
3. Remove the default `.git` folder if created

### Step 2: Install Required Dependencies
```bash
npm install @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql
npm install @mikro-orm/migrations @mikro-orm/cli
npm install class-validator class-transformer
npm install nanoid
npm install --save-dev @types/node
```

### Step 3: Configure MikroORM
1. Create `mikro-orm.config.ts` in the root of backend:
```typescript
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  dbName: 'url_shortener',
  type: 'postgresql',
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
});
```

2. Update `package.json` scripts:
```json
"mikro-orm": "mikro-orm",
"migration:create": "mikro-orm migration:create",
"migration:up": "mikro-orm migration:up"
```

### Step 4: Create Database Entities

1. Create `src/entities/url.entity.ts`:
```typescript
import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { ClickAnalytics } from './click-analytics.entity';

@Entity()
export class Url {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  shortUrl!: string;

  @Property({ columnType: 'text' })
  originalUrl!: string;

  @Property({ nullable: true })
  alias?: string;

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ default: 0 })
  clickCount: number = 0;

  @OneToMany(() => ClickAnalytics, analytics => analytics.url)
  analytics = new Collection<ClickAnalytics>(this);
}
```

2. Create `src/entities/click-analytics.entity.ts`:
```typescript
import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Url } from './url.entity';

@Entity()
export class ClickAnalytics {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Url)
  url!: Url;

  @Property()
  ipAddress!: string;

  @Property()
  clickedAt: Date = new Date();
}
```

### Step 5: Create DTOs

1. Create `src/dto/create-url.dto.ts`:
```typescript
import { IsUrl, IsOptional, IsDateString, IsString, MaxLength } from 'class-validator';

export class CreateUrlDto {
  @IsUrl()
  originalUrl: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alias?: string;
}
```

2. Create `src/dto/url-info.dto.ts`:
```typescript
export class UrlInfoDto {
  originalUrl: string;
  createdAt: Date;
  clickCount: number;
  shortUrl: string;
  expiresAt?: Date;
}
```

3. Create `src/dto/analytics.dto.ts`:
```typescript
export class AnalyticsDto {
  clickCount: number;
  lastIpAddresses: string[];
}
```

### Step 6: Create URL Service

Create `src/url/url.service.ts`:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Url } from '../entities/url.entity';
import { ClickAnalytics } from '../entities/click-analytics.entity';
import { CreateUrlDto } from '../dto/create-url.dto';
import { nanoid } from 'nanoid';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: EntityRepository<Url>,
    @InjectRepository(ClickAnalytics)
    private readonly analyticsRepository: EntityRepository<ClickAnalytics>,
  ) {}

  async createShortUrl(createUrlDto: CreateUrlDto): Promise<Url> {
    const { originalUrl, expiresAt, alias } = createUrlDto;

    // Check if alias already exists
    if (alias) {
      const existing = await this.urlRepository.findOne({ alias });
      if (existing) {
        throw new BadRequestException('Alias already exists');
      }
    }

    const shortUrl = alias || nanoid(8);
    const url = this.urlRepository.create({
      originalUrl,
      shortUrl,
      alias,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await this.urlRepository.persistAndFlush(url);
    return url;
  }

  async getOriginalUrl(shortUrl: string): Promise<string> {
    const url = await this.urlRepository.findOne({
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
    const url = await this.urlRepository.findOne({
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) return;

    url.clickCount++;

    const analytics = this.analyticsRepository.create({
      url,
      ipAddress,
    });

    await this.analyticsRepository.persistAndFlush(analytics);
    await this.urlRepository.flush();
  }

  async getUrlInfo(shortUrl: string): Promise<any> {
    const url = await this.urlRepository.findOne({
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
    const url = await this.urlRepository.findOne({
      $or: [{ shortUrl }, { alias: shortUrl }]
    }, { populate: ['analytics'] });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    await this.urlRepository.removeAndFlush(url);
  }

  async getAnalytics(shortUrl: string): Promise<any> {
    const url = await this.urlRepository.findOne({
      $or: [{ shortUrl }, { alias: shortUrl }]
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    const recentClicks = await this.analyticsRepository.find(
      { url },
      { orderBy: { clickedAt: 'DESC' }, limit: 5 }
    );

    return {
      clickCount: url.clickCount,
      lastIpAddresses: recentClicks.map(click => click.ipAddress),
    };
  }
}
```

### Step 7: Create URL Controller

Create `src/url/url.controller.ts`:
```typescript
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
```

### Step 8: Create URL Module

Create `src/url/url.module.ts`:
```typescript
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
```

### Step 9: Update App Module

Update `src/app.module.ts`:
```typescript
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
```

### Step 10: Enable CORS and Validation

Update `src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  await app.listen(3000);
}
bootstrap();
```

### Step 11: Create Tests

1. Create `src/url/url.service.spec.ts`:
```typescript
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
```

### Step 12: Create Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY mikro-orm.config.ts ./

EXPOSE 3000

CMD ["node", "dist/main"]
```

## Phase 2: Frontend Setup

### Step 1: Initialize Frontend Project
```bash
cd .. && mkdir frontend && cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

### Step 2: Install Additional Dependencies
```bash
npm install axios react-query @tanstack/react-query
npm install @mui/material @emotion/react @emotion/styled
npm install react-hook-form
npm install react-toastify
```

### Step 3: Create API Service

Create `src/services/api.ts`:
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface CreateUrlData {
  originalUrl: string;
  alias?: string;
  expiresAt?: string;
}

export interface UrlInfo {
  originalUrl: string;
  createdAt: string;
  clickCount: number;
  shortUrl: string;
  expiresAt?: string;
}

export interface Analytics {
  clickCount: number;
  lastIpAddresses: string[];
}

export const urlApi = {
  createShortUrl: (data: CreateUrlData) =>
    api.post('/shorten', data),

  getUrlInfo: (shortUrl: string) =>
    api.get<UrlInfo>(`/info/${shortUrl}`),

  deleteUrl: (shortUrl: string) =>
    api.delete(`/delete/${shortUrl}`),

  getAnalytics: (shortUrl: string) =>
    api.get<Analytics>(`/analytics/${shortUrl}`),
};
```

### Step 4: Create Components

1. Create `src/components/UrlShortener.tsx`:
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import { urlApi, CreateUrlData } from '../services/api';
import { toast } from 'react-toastify';

export const UrlShortener: React.FC = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUrlData>();

  const createMutation = useMutation({
    mutationFn: urlApi.createShortUrl,
    onSuccess: (response) => {
      toast.success('Short URL created successfully!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create short URL');
    },
  });

  const onSubmit = (data: CreateUrlData) => {
    createMutation.mutate(data);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Short URL
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Original URL"
          {...register('originalUrl', {
            required: 'URL is required',
            pattern: {
              value: /^https?:\/\/.+/,
              message: 'Please enter a valid URL'
            }
          })}
          error={!!errors.originalUrl}
          helperText={errors.originalUrl?.message}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Custom Alias (optional)"
          {...register('alias', {
            maxLength: {
              value: 20,
              message: 'Alias must be 20 characters or less'
            }
          })}
          error={!!errors.alias}
          helperText={errors.alias?.message}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Expiration Date (optional)"
          type="datetime-local"
          {...register('expiresAt')}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={createMutation.isPending}
        >
          Create Short URL
        </Button>
      </Box>

      {createMutation.isSuccess && createMutation.data && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Short URL: {createMutation.data.data.shortUrl}
        </Alert>
      )}
    </Paper>
  );
};
```

2. Create `src/components/UrlList.tsx`:
```typescript
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useMutation, useQuery } from '@tanstack/react-query';
import { urlApi } from '../services/api';
import { toast } from 'react-toastify';

// This is a simplified version - in real app, you'd fetch URLs from backend
export const UrlList: React.FC = () => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<'info' | 'analytics' | null>(null);

  const deleteMutation = useMutation({
    mutationFn: urlApi.deleteUrl,
    onSuccess: () => {
      toast.success('URL deleted successfully');
    },
  });

  const { data: urlInfo } = useQuery({
    queryKey: ['urlInfo', selectedUrl],
    queryFn: () => selectedUrl ? urlApi.getUrlInfo(selectedUrl) : null,
    enabled: !!selectedUrl && dialogType === 'info',
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', selectedUrl],
    queryFn: () => selectedUrl ? urlApi.getAnalytics(selectedUrl) : null,
    enabled: !!selectedUrl && dialogType === 'analytics',
  });

  const handleDelete = (shortUrl: string) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      deleteMutation.mutate(shortUrl);
    }
  };

  const handleOpenDialog = (type: 'info' | 'analytics', shortUrl: string) => {
    setSelectedUrl(shortUrl);
    setDialogType(type);
  };

  const handleCloseDialog = () => {
    setSelectedUrl(null);
    setDialogType(null);
  };

  // Mock data - replace with actual data from backend
  const urls = [
    { shortUrl: 'abc123', originalUrl: 'https://example.com' },
  ];

  return (
    <>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Your URLs
        </Typography>

        <List>
          {urls.map((url) => (
            <ListItem
              key={url.shortUrl}
              secondaryAction={
                <Box>
                  <IconButton onClick={() => handleOpenDialog('info', url.shortUrl)}>
                    <InfoIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDialog('analytics', url.shortUrl)}>
                    <AnalyticsIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(url.shortUrl)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={`/${url.shortUrl}`}
                secondary={url.originalUrl}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogType === 'info'} onClose={handleCloseDialog}>
        <DialogTitle>URL Information</DialogTitle>
        <DialogContent>
          {urlInfo?.data && (
            <Box>
              <Typography>Original URL: {urlInfo.data.originalUrl}</Typography>
              <Typography>Created: {new Date(urlInfo.data.createdAt).toLocaleString()}</Typography>
              <Typography>Clicks: {urlInfo.data.clickCount}</Typography>
              {urlInfo.data.expiresAt && (
                <Typography>Expires: {new Date(urlInfo.data.expiresAt).toLocaleString()}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogType === 'analytics'} onClose={handleCloseDialog}>
        <DialogTitle>URL Analytics</DialogTitle>
        <DialogContent>
          {analytics?.data && (
            <Box>
              <Typography>Total Clicks: {analytics.data.clickCount}</Typography>
              <Typography sx={{ mt: 2 }}>Recent IP Addresses:</Typography>
              <List>
                {analytics.data.lastIpAddresses.map((ip, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={ip} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
```

### Step 5: Update App Component

Update `src/App.tsx`:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Container, Typography, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UrlShortener } from './components/UrlShortener';
import { UrlList } from './components/UrlList';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            URL Shortener
          </Typography>

          <UrlShortener />
          <UrlList />
        </Box>
      </Container>
      <ToastContainer position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
```

### Step 6: Create Frontend Dockerfile

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 7: Create Nginx Config

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Phase 3: Docker Setup

### Step 1: Create Docker Compose File

Create `docker-compose.yml` in the root directory:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: url_shortener
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: url_shortener
      BASE_URL: http://localhost:3000
      FRONTEND_URL: http://localhost
    ports:
      - "3000:3000"
    command: >
      sh -c "npm run migration:up && node dist/main"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://localhost:3000

volumes:
  postgres_data:
```

### Step 2: Create .env Files

1. Create `backend/.env`:
```env
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=url_shortener
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost
```

2. Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

## Phase 4: Final Setup Steps

### Step 1: Create Initial Migration

In the backend directory:
```bash
npm run build
npm run migration:create -- --initial
```

### Step 2: Create README

Create `README.md` in the root directory:
```markdown
# URL Shortener Service

A full-stack URL shortener application with analytics.

## Features

- Create short URLs with optional custom aliases
- Set expiration dates for URLs
- Track click analytics
- View URL statistics
- Delete URLs

## Tech Stack

- Backend: NestJS, TypeScript, PostgreSQL, MikroORM
- Frontend: React, TypeScript, Material-UI
- Infrastructure: Docker, Docker Compose

## Getting Started

1. Clone the repository
2. Run the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost
   - API: http://localhost:3000

## API Endpoints

- `POST /shorten` - Create a short URL
- `GET /{shortUrl}` - Redirect to original URL
- `GET /info/{shortUrl}` - Get URL information
- `DELETE /delete/{shortUrl}` - Delete a URL
- `GET /analytics/{shortUrl}` - Get click analytics

## Testing

Run backend tests:
```bash
cd backend
npm test
```
```

## Implementation Notes

1. **Database Migrations**: Run migrations automatically on container startup
2. **Error Handling**: All endpoints include proper error responses
3. **Validation**: Input validation using class-validator
4. **CORS**: Configured for frontend-backend communication
5. **Analytics**: IP addresses are tracked for each click
6. **Expiration**: URLs can have optional expiration dates

## Development Workflow

1. Start with backend implementation
2. Test each endpoint using Postman or curl
3. Implement frontend components
4. Test integration between frontend and backend
5. Run docker-compose to ensure everything works together

## Common Issues and Solutions

1. **Port conflicts**: Ensure ports 80, 3000, and 5432 are free
2. **Database connection**: Wait for PostgreSQL to be healthy before starting backend
3. **CORS issues**: Check environment variables for correct URLs
4. **Migration errors**: Ensure database is created before running migrations
