import { Migration } from '@mikro-orm/migrations';

export class Migration20241206000000 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "url" ("id" serial primary key, "short_url" varchar(255) not null, "original_url" text not null, "alias" varchar(255) null, "expires_at" timestamptz null, "created_at" timestamptz not null, "click_count" int not null default 0);');
    this.addSql('alter table "url" add constraint "url_short_url_unique" unique ("short_url");');

    this.addSql('create table "click_analytics" ("id" serial primary key, "url_id" int not null, "ip_address" varchar(255) not null, "clicked_at" timestamptz not null);');

    this.addSql('alter table "click_analytics" add constraint "click_analytics_url_id_foreign" foreign key ("url_id") references "url" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "click_analytics" drop constraint "click_analytics_url_id_foreign";');

    this.addSql('drop table if exists "url" cascade;');

    this.addSql('drop table if exists "click_analytics" cascade;');
  }

}