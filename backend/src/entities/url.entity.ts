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