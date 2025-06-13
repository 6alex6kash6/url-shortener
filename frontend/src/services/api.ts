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

  getAllUrls: () =>
    api.get<UrlInfo[]>('/api/urls'),

  getUrlInfo: (shortUrl: string) =>
    api.get<UrlInfo>(`/info/${shortUrl}`),

  deleteUrl: (shortUrl: string) =>
    api.delete(`/delete/${shortUrl}`),

  getAnalytics: (shortUrl: string) =>
    api.get<Analytics>(`/analytics/${shortUrl}`),
};