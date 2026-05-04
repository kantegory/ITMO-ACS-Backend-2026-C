import { Request, Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import {
  AuthRequestDto,
  RegisterUserDto,
  UpdateProfileDto,
} from "../dto/userDtos";
import { userService } from "../services";
import { getUserIdFromToken } from "common";
import { Role } from "../models/role.enum";

async function validateDto<T extends object>(cls: new () => T, data: unknown) {
  const dto = plainToInstance(cls, data);
  const errors = await validate(dto as object);
  return { dto, errors };
}

class UserController {
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { dto, errors } = await validateDto(RegisterUserDto, req.body);
      if (errors.length) {
        res.status(400).json({ message: "Invalid registration data", errors });
        return;
      }

      const user = await userService.register(dto);

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { dto, errors } = await validateDto(AuthRequestDto, req.body);
      if (errors.length) {
        res.status(400).json({ message: "Invalid email or password", errors });
        return;
      }

      const result = await userService.authenticate(dto);
      if (!result) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const { token } = result;

      res.status(200).json({ token });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = getUserIdFromToken(req);
      if (!id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await userService.getById(id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json(user);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const ids = String(req.query.ids || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      if (!ids.length) {
        res.status(400).json({ message: "ids is required" });
        return;
      }

      const users = await userService.batch(ids);
      res.status(200).json(users);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getBatchInternal = async (req: Request, res: Response): Promise<void> => {
    try {
      const ids = String(req.query.ids || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      if (!ids.length) {
        res.status(400).json({ message: "ids is required" });
        return;
      }

      const users = await userService.batchInternal(ids);
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      if (!id) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const isValid = await userService.validateActive(id);
      if (!isValid) {
        res.status(404).json({ message: "User not found or inactive" });
        return;
      }

      res.status(200).json({ valid: true });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  };

  verify = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserIdFromToken(req);

      if (!userId) {
        res.status(401).send({ isValid: false });
        return;
      }

      const isValid = await userService.verifyUser(userId);
      res.status(isValid ? 200 : 404).send({ isValid });
    } catch {
      res.status(500).send({ isValid: false });
    }
  };

  updateRole = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const currentUserId = getUserIdFromToken(req);
    if (!currentUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const role = String(req.body?.role || "");

    if (!Object.values(Role).includes(role as Role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const updated = await userService.updateRole(id, role as Role);
    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(updated);
  };

  updateProfile = async (
    req: Request<{}, {}, UpdateProfileDto>,
    res: Response,
  ): Promise<void> => {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return void res.status(401).json({ message: "Unauthorized" });
    }

    const updated = await userService.updateProfile(userId, req.body);
    res.status(200).json(updated);
  };
}

export default new UserController();
