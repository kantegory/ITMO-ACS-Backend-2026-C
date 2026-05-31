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
exports.Reaction = exports.ReactionType = void 0;
const typeorm_1 = require("typeorm");
var ReactionType;
(function (ReactionType) {
    ReactionType["LIKE"] = "like";
    ReactionType["DISLIKE"] = "dislike";
})(ReactionType || (exports.ReactionType = ReactionType = {}));
let Reaction = class Reaction {
};
exports.Reaction = Reaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Reaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], Reaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipe_id' }),
    __metadata("design:type", Number)
], Reaction.prototype, "recipeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ReactionType }),
    __metadata("design:type", String)
], Reaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Reaction.prototype, "createdAt", void 0);
exports.Reaction = Reaction = __decorate([
    (0, typeorm_1.Entity)('reactions'),
    (0, typeorm_1.Unique)(['userId', 'recipeId'])
], Reaction);
