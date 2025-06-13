"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20241206000000 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20241206000000 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "url" ("id" serial primary key, "short_url" varchar(255) not null, "original_url" text not null, "alias" varchar(255) null, "expires_at" timestamptz null, "created_at" timestamptz not null, "click_count" int not null default 0);');
        this.addSql('alter table "url" add constraint "url_short_url_unique" unique ("short_url");');
        this.addSql('create table "click_analytics" ("id" serial primary key, "url_id" int not null, "ip_address" varchar(255) not null, "clicked_at" timestamptz not null);');
        this.addSql('alter table "click_analytics" add constraint "click_analytics_url_id_foreign" foreign key ("url_id") references "url" ("id") on update cascade;');
    }
    async down() {
        this.addSql('alter table "click_analytics" drop constraint "click_analytics_url_id_foreign";');
        this.addSql('drop table if exists "url" cascade;');
        this.addSql('drop table if exists "click_analytics" cascade;');
    }
}
exports.Migration20241206000000 = Migration20241206000000;
//# sourceMappingURL=Migration20241206000000.js.map