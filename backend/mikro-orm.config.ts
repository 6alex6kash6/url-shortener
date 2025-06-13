import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  dbName: 'url_shortener',
  host: process.env.DB_HOST || 'postgres',
  port: 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
});