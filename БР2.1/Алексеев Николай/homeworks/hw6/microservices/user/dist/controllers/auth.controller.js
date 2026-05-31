"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
class AuthController {
    constructor() {
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        this.register = async (req, res) => {
            try {
                const { login, email, password, confPassword, firstName, lastName } = req.body;
                if (password !== confPassword) {
                    return res.status(401).json({
                        code: 401,
                        message: 'Unauthorized: Invalid credentials or session expired',
                    });
                }
                const existingUser = await this.userRepository.findOne({
                    where: [{ login }, { email }],
                });
                if (existingUser) {
                    return res.status(409).json({
                        code: 409,
                        message: 'Conflict: Duplicate resource or constraint violation',
                    });
                }
                const user = this.userRepository.create({
                    login,
                    email,
                    password,
                    firstName,
                    lastName,
                });
                await this.userRepository.save(user);
                const token = jsonwebtoken_1.default.sign({ userId: user.id, login: user.login, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
                const { password: _, ...userWithoutPassword } = user;
                res.status(201).json({
                    user: userWithoutPassword,
                    accessToken: token,
                });
            }
            catch (error) {
                console.error('Register error:', error);
                res.status(500).json({
                    code: 500,
                    message: 'Internal server error occurred',
                });
            }
        };
        this.login = async (req, res) => {
            try {
                const { login, password } = req.body;
                const user = await this.userRepository.findOne({
                    where: [{ login }, { email: login }],
                });
                if (!user || !(await user.comparePassword(password))) {
                    return res.status(401).json({
                        code: 401,
                        message: 'Unauthorized: Invalid credentials or session expired',
                    });
                }
                const token = jsonwebtoken_1.default.sign({ userId: user.id, login: user.login, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
                const { password: _, ...userWithoutPassword } = user;
                res.json({
                    user: userWithoutPassword,
                    accessToken: token,
                });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({
                    code: 500,
                    message: 'Internal server error occurred',
                });
            }
        };
        this.logout = async (req, res) => {
            try {
                res.status(204).send();
            }
            catch (error) {
                console.error('Logout error:', error);
                res.status(500).json({
                    code: 500,
                    message: 'Internal server error occurred',
                });
            }
        };
        this.getUserById = async (req, res) => {
            try {
                const serviceToken = req.headers['x-service-token'];
                if (serviceToken !== process.env.INTERNAL_TOKEN) {
                    return res.status(401).json({ code: 401, message: 'Unauthorized' });
                }
                const user = await this.userRepository.findOne({
                    where: { id: parseInt(req.params.id) },
                    select: ['id', 'login', 'firstName', 'lastName', 'photoUrl', 'role'],
                });
                if (!user) {
                    return res.status(404).json({ code: 404, message: 'User not found' });
                }
                res.json(user);
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getUsersBatch = async (req, res) => {
            try {
                const serviceToken = req.headers['x-service-token'];
                if (serviceToken !== process.env.INTERNAL_TOKEN) {
                    return res.status(401).json({ code: 401, message: 'Unauthorized' });
                }
                const { userIds } = req.body;
                const users = await this.userRepository
                    .createQueryBuilder('user')
                    .where('user.id IN (:...userIds)', { userIds })
                    .select(['user.id', 'user.login', 'user.firstName', 'user.lastName', 'user.photoUrl', 'user.role'])
                    .getMany();
                res.json(users);
            }
            catch (error) {
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
    }
}
exports.AuthController = AuthController;
