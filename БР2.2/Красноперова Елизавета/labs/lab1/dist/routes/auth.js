"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controller/AuthController");
const router = (0, express_1.Router)();
router.post("/register", AuthController_1.AuthController.register);
router.post("/login", AuthController_1.AuthController.login);
exports.default = router;
