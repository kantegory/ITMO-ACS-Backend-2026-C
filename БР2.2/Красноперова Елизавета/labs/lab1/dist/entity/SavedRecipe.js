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
exports.SavedRecipe = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Recipe_1 = require("./Recipe");
let SavedRecipe = class SavedRecipe {
};
exports.SavedRecipe = SavedRecipe;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SavedRecipe.prototype, "saved_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SavedRecipe.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SavedRecipe.prototype, "recipe_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SavedRecipe.prototype, "saved_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.savedRecipes, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], SavedRecipe.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Recipe_1.Recipe, recipe => recipe.savedBy, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "recipe_id" }),
    __metadata("design:type", Recipe_1.Recipe)
], SavedRecipe.prototype, "recipe", void 0);
exports.SavedRecipe = SavedRecipe = __decorate([
    (0, typeorm_1.Entity)("saved_recipes"),
    (0, typeorm_1.Unique)(["user_id", "recipe_id"])
], SavedRecipe);
