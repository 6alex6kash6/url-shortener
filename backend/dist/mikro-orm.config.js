"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
exports.default = (0, postgresql_1.defineConfig)({
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
//# sourceMappingURL=mikro-orm.config.js.map