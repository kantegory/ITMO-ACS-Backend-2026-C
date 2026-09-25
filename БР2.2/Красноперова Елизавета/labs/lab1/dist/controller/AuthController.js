"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const index_1 = require("../index");
const User_1 = require("../entity/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = "your-secret-key-change-in-production";
const userRepository = () => index_1.AppDataSource.getRepository(User_1.User);
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existing = await userRepository().findOne({ where: [{ username }, { email }] });
        if (existing) {
            return res.status(409).json({ error: { code: "CONFLICT", message: "Username или email уже занят" } });
        }
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const user = userRepository().create({ username, email, password_hash });
        await userRepository().save(user);
        const token = jsonwebtoken_1.default.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                avatar_url: user.avatar_url,
                bio: user.bio
            }
        });
    }
    catch (error) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка валидации" } });
    }
};
AuthController.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userRepository().findOne({ where: { email } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password_hash))) {
            return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Неверный email или пароль" } });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "7d" });
        return res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                avatar_url: user.avatar_url,
                bio: user.bio
            }
        });
    }
    catch (error) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Ошибка валидации" } });
    }
};
