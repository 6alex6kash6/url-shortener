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