export class UrlInfoDto {
  originalUrl: string;
  createdAt: Date;
  clickCount: number;
  shortUrl: string;
  expiresAt?: Date;
}