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