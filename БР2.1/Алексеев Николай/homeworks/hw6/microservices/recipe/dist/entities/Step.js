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
exports.Step = void 0;
const typeorm_1 = require("typeorm");
const Recipe_1 = require("./Recipe");
let Step = class Step {
};
exports.Step = Step;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Step.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipe_id' }),
    __metadata("design:type", Number)
], Step.prototype, "recipeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', nullable: true, length: 500 }),
    __metadata("design:type", String)
], Step.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Step.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'step_number', type: 'smallint' }),
    __metadata("design:type", Number)
], Step.prototype, "stepNumber", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Recipe_1.Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'recipe_id' }),
    __metadata("design:type", Recipe_1.Recipe)
], Step.prototype, "recipe", void 0);
exports.Step = Step = __decorate([
    (0, typeorm_1.Entity)('steps'),
    (0, typeorm_1.Unique)(['recipeId', 'stepNumber'])
], Step);
