import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { Role, User } from '../entities';
import { authRequired, signToken } from '../auth';
import { HttpError, requiredString } from '../http';
import { userDto } from '../serializers';

export const authRouter = Router();

authRouter.post('/auth/register', async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(User);
    const phone = requiredString(req.body.phone, 'phone');

    const existing = await repo.findOneBy({ phone });
    if (existing) throw new HttpError(409, 'phone_already_exists', 'Phone already exists');

    const user = repo.create({
      name: requiredString(req.body.name, 'name'),
      birthdate: requiredString(req.body.birthdate, 'birthdate'),
      phone,
      passwordHash: await bcrypt.hash(requiredString(req.body.password, 'password'), 10),
      role: Role.User,
      isVerified: false
    });

    await repo.save(user);

    res.status(201).json({
      accessToken: signToken({ id: user.id, role: user.role }),
      tokenType: 'Bearer',
      user: userDto(user)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/login', async (req, res, next) => {
  try {
    const phone = requiredString(req.body.phone, 'phone');
    const password = requiredString(req.body.password, 'password');
    const user = await AppDataSource.getRepository(User).findOneBy({ phone });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'invalid_credentials', 'Invalid phone or password');
    }

    res.json({
      accessToken: signToken({ id: user.id, role: user.role }),
      tokenType: 'Bearer',
      user: userDto(user)
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/users/me', authRequired, async (req, res, next) => {
  try {
    const user = await AppDataSource.getRepository(User).findOneBy({ id: req.user!.id });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found');

    res.json(userDto(user));
  } catch (error) {
    next(error);
  }
});

authRouter.patch('/users/me', authRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: req.user!.id });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found');

    if (req.body.name !== undefined) user.name = requiredString(req.body.name, 'name');
    if (req.body.birthdate !== undefined) user.birthdate = requiredString(req.body.birthdate, 'birthdate');
    if (req.body.phone !== undefined) user.phone = requiredString(req.body.phone, 'phone');

    await repo.save(user);
    res.json(userDto(user));
  } catch (error) {
    next(error);
  }
});
