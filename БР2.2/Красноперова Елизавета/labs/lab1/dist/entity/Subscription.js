"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subscription.prototype, "sub_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Subscription.prototype, "follower_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Subscription.prototype, "followed_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Subscription.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.subscriptions, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "follower_id" }),
    __metadata("design:type", User_1.User)
], Subscription.prototype, "follower", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.subscribers, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "followed_id" }),
    __metadata("design:type", User_1.User)
], Subscription.prototype, "followed", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)("subscriptions"),
    (0, typeorm_1.Unique)(["follower_id", "followed_id"])
], Subscription);
