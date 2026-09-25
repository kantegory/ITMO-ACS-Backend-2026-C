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
const User_1 = require("./User");
const Step_1 = require("./Step");
const RecipeIngredient_1 = require("./RecipeIngredient");
const Comment_1 = require("./Comment");
const Like_1 = require("./Like");
const SavedRecipe_1 = require("./SavedRecipe");
let Recipe = class Recipe {
};
exports.Recipe = Recipe;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Recipe.prototype, "recipe_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Recipe.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Recipe.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Recipe.prototype, "photo_main_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Recipe.prototype, "video_url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Recipe.prototype, "cooking_time_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: ["easy", "medium", "hard"], default: "medium" }),
    __metadata("design:type", String)
], Recipe.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Recipe.prototype, "dish_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Recipe.prototype, "is_published", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Recipe.prototype, "published_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.recipes, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "author_id" }),
    __metadata("design:type", User_1.User)
], Recipe.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Recipe.prototype, "author_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Step_1.Step, step => step.recipe, { cascade: true }),
    __metadata("design:type", Array)
], Recipe.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RecipeIngredient_1.RecipeIngredient, ri => ri.recipe, { cascade: true }),
    __metadata("design:type", Array)
], Recipe.prototype, "recipeIngredients", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Comment_1.Comment, comment => comment.recipe),
    __metadata("design:type", Array)
], Recipe.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Like_1.Like, like => like.recipe),
    __metadata("design:type", Array)
], Recipe.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SavedRecipe_1.SavedRecipe, saved => saved.recipe),
    __metadata("design:type", Array)
], Recipe.prototype, "savedBy", void 0);
exports.Recipe = Recipe = __decorate([
    (0, typeorm_1.Entity)("recipes")
], Recipe);
