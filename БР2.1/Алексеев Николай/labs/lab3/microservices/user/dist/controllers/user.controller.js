"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const Subscription_1 = require("../entities/Subscription");
class UserController {
    constructor() {
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        this.subscriptionRepository = data_source_1.AppDataSource.getRepository(Subscription_1.Subscription);
        this.getMe = async (req, res) => {
            try {
                const user = await this.userRepository.findOne({
                    where: { id: req.user?.userId },
                    select: ['id', 'login', 'email', 'firstName', 'lastName', 'role', 'photoUrl', 'createdAt'],
                });
                if (!user) {
                    return res.status(404).json({ code: 404, message: 'User not found' });
                }
                res.json(user);
            }
            catch (error) {
                console.error('Get me error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.updateMe = async (req, res) => {
            try {
                const { firstName, lastName, photoUrl } = req.body;
                await this.userRepository.update(req.user.userId, { firstName, lastName, photoUrl });
                const updatedUser = await this.userRepository.findOne({
                    where: { id: req.user.userId },
                    select: ['id', 'login', 'email', 'firstName', 'lastName', 'role', 'photoUrl'],
                });
                res.json(updatedUser);
            }
            catch (error) {
                console.error('Update me error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getUserById = async (req, res) => {
            try {
                const userId = parseInt(req.params.id);
                const user = await this.userRepository.findOne({
                    where: { id: userId },
                    select: ['id', 'login', 'firstName', 'lastName', 'photoUrl', 'role', 'createdAt'],
                });
                if (!user) {
                    return res.status(404).json({ code: 404, message: 'User not found' });
                }
                res.json(user);
            }
            catch (error) {
                console.error('Get user by id error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.getSubscriptions = async (req, res) => {
            try {
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 20;
                const [subscriptions, total] = await this.subscriptionRepository.findAndCount({
                    where: { followerId: req.user.userId },
                    skip: (page - 1) * limit,
                    take: limit,
                    order: { createdAt: 'DESC' },
                });
                res.json({
                    items: subscriptions,
                    total,
                    page,
                    limit,
                });
            }
            catch (error) {
                console.error('Get subscriptions error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.subscribe = async (req, res) => {
            try {
                const authorId = parseInt(req.params.authorId);
                if (authorId === req.user.userId) {
                    return res.status(400).json({ code: 400, message: 'Cannot subscribe to yourself' });
                }
                const existing = await this.subscriptionRepository.findOne({
                    where: { followerId: req.user.userId, authorId },
                });
                if (existing) {
                    return res.status(409).json({ code: 409, message: 'Already subscribed' });
                }
                const subscription = this.subscriptionRepository.create({
                    followerId: req.user.userId,
                    authorId,
                });
                await this.subscriptionRepository.save(subscription);
                res.status(201).json(subscription);
            }
            catch (error) {
                console.error('Subscribe error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
        this.unsubscribe = async (req, res) => {
            try {
                const authorId = parseInt(req.params.authorId);
                await this.subscriptionRepository.delete({
                    followerId: req.user.userId,
                    authorId,
                });
                res.status(204).send();
            }
            catch (error) {
                console.error('Unsubscribe error:', error);
                res.status(500).json({ code: 500, message: 'Internal error' });
            }
        };
    }
}
exports.UserController = UserController;
