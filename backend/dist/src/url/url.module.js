"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_1 = require("@mikro-orm/nestjs");
const url_controller_1 = require("./url.controller");
const url_service_1 = require("./url.service");
const url_entity_1 = require("../entities/url.entity");
const click_analytics_entity_1 = require("../entities/click-analytics.entity");
let UrlModule = class UrlModule {
};
exports.UrlModule = UrlModule;
exports.UrlModule = UrlModule = __decorate([
    (0, common_1.Module)({
        imports: [nestjs_1.MikroOrmModule.forFeature([url_entity_1.Url, click_analytics_entity_1.ClickAnalytics])],
        controllers: [url_controller_1.UrlController],
        providers: [url_service_1.UrlService],
    })
], UrlModule);
//# sourceMappingURL=url.module.js.map