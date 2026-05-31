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
exports.Recipe = void 0;
const typeorm_1 = require("typeorm");
const Step_1 = require("./Step");
const Ingredient_1 = require("./Ingredient");
let Recipe = class Recipe {
};
exports.Recipe = Recipe;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Recipe.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id' }),
    __metadata("design:type", Number)
], Recipe.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'type_id' }),
    __metadata("design:type", Number)
], Recipe.prototype, "typeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cuisine_id' }),
    __metadata("design:type", Number)
], Recipe.prototype, "cuisineId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Recipe.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Recipe.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', length: 500 }),
    __metadata("design:type", String)
], Recipe.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'video_url', nullable: true, length: 500 }),
    __metadata("design:type", String)
], Recipe.prototype, "videoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cook_time' }),
    __metadata("design:type", Number)
], Recipe.prototype, "cookTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_published', default: false }),
    __metadata("design:type", Boolean)
], Recipe.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'people_amount', type: 'smallint', default: 2 }),
    __metadata("design:type", Number)
], Recipe.prototype, "peopleAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Recipe.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Recipe.prototype, "dislikes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Recipe.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Recipe.prototype, "saves", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Recipe.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Recipe.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Step_1.Step, (step) => step.recipe, { cascade: true }),
    __metadata("design:type", Array)
], Recipe.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Ingredient_1.Ingredient, (ingredient) => ingredient.recipe, { cascade: true }),
    __metadata("design:type", Array)
], Recipe.prototype, "ingredients", void 0);
exports.Recipe = Recipe = __decorate([
    (0, typeorm_1.Entity)('recipes')
], Recipe);
