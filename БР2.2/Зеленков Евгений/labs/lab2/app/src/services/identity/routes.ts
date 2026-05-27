import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { IdentityDataSource } from './data-source';
import { User } from './entities';
import { internalUserDto, userDto } from './serializers';
import { adminRequired, authRequired, serviceTokenRequired, signToken } from '../../shared/auth';
import { Role } from '../../shared/enums';
import { HttpError } from '../../shared/errors';
import { requiredString } from '../../shared/validation';

export const identityRouter = Router();

identityRouter.post('/auth/register', async (req, res, next) => {
  try {
    const repo = IdentityDataSource.getRepository(User);
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
    res.status(201).json({ accessToken: signToken({ id: user.id, role: user.role }), tokenType: 'Bearer', user: userDto(user) });
  } catch (error) {
    next(error);
  }
});

identityRouter.post('/auth/login', async (req, res, next) => {
  try {
    const phone = requiredString(req.body.phone, 'phone');
    const password = requiredString(req.body.password, 'password');
    const user = await IdentityDataSource.getRepository(User).findOneBy({ phone });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'invalid_credentials', 'Invalid phone or password');
    }

    res.json({ accessToken: signToken({ id: user.id, role: user.role }), tokenType: 'Bearer', user: userDto(user) });
  } catch (error) {
    next(error);
  }
});

identityRouter.get('/users/me', authRequired, async (req, res, next) => {
  try {
    const user = await IdentityDataSource.getRepository(User).findOneBy({ id: req.user!.id });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found');
    res.json(userDto(user));
  } catch (error) {
    next(error);
  }
});

identityRouter.patch('/users/me', authRequired, async (req, res, next) => {
  try {
    const repo = IdentityDataSource.getRepository(User);
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

identityRouter.post('/internal/v1/users/validate', serviceTokenRequired, async (req, res, next) => {
  try {
    const user = await IdentityDataSource.getRepository(User).findOneBy({ id: requiredString(req.body.userId, 'userId') });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found');
    res.json({ valid: true, user: internalUserDto(user) });
  } catch (error) {
    next(error);
  }
});

identityRouter.get('/internal/v1/users/:userId', serviceTokenRequired, async (req, res, next) => {
  try {
    const user = await IdentityDataSource.getRepository(User).findOneBy({ id: req.params.userId });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found');
    res.json(internalUserDto(user));
  } catch (error) {
    next(error);
  }
});
