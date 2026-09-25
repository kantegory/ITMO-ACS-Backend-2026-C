"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const User_1 = require("../entity/User");
const repo = () => index_1.AppDataSource.getRepository(User_1.User);
const secret = () => process.env.JWT_SECRET || "your-secret-key-change-in-production";
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = async (req, res) => { try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "Необходимо заполнить username, email и password" } });
    const ex = await repo().findOne({ where: [{ username }, { email }] });
    if (ex)
        return res.status(409).json({ error: { code: "CONFLICT", message: "Username или email уже занят" } });
    const u = repo().create({ username, email, password_hash: await bcryptjs_1.default.hash(password, 10) });
    await repo().save(u);
    const token = jsonwebtoken_1.default.sign({ userId: u.user_id }, secret(), { expiresIn: "7d" });
    return res.status(201).json({ token, user: { user_id: u.user_id, username: u.username, avatar_url: u.avatar_url, bio: u.bio } });
}
catch (_b) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка валидации" } });
} };
AuthController.login = async (req, res) => { try {
    const { email, password } = req.body;
    const u = await repo().findOne({ where: { email } });
    if (!u || !(await bcryptjs_1.default.compare(password, u.password_hash)))
        return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Неверный email или пароль" } });
    const token = jsonwebtoken_1.default.sign({ userId: u.user_id }, secret(), { expiresIn: "7d" });
    return res.json({ token, user: { user_id: u.user_id, username: u.username, avatar_url: u.avatar_url, bio: u.bio } });
}
catch (_b) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка валидации" } });
} };
