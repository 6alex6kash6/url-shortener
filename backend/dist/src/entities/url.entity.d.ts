import { Collection } from '@mikro-orm/core';
import { ClickAnalytics } from './click-analytics.entity';
export declare class Url {
    id: number;
    shortUrl: string;
    originalUrl: string;
    alias?: string;
    expiresAt?: Date;
    createdAt: Date;
    clickCount: number;
    analytics: Collection<ClickAnalytics, object>;
}
