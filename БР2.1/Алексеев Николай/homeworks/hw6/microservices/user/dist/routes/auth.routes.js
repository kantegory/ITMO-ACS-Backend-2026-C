"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', [
    (0, express_validator_1.body)('login').isLength({ min: 3 }).trim(),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('confPassword').custom((value, { req }) => value === req.body.password),
    (0, express_validator_1.body)('firstName').notEmpty().trim(),
    (0, express_validator_1.body)('lastName').notEmpty().trim(),
], authController.register);
router.post('/login', [(0, express_validator_1.body)('login').notEmpty(), (0, express_validator_1.body)('password').notEmpty()], authController.login);
router.post('/logout', auth_middleware_1.authMiddleware, authController.logout);
router.get('/internal/users/:id', authController.getUserById);
router.post('/internal/users/batch', authController.getUsersBatch);
exports.default = router;
