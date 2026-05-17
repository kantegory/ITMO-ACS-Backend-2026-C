import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async subscribe(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) {
      throw new ConflictException('Cannot subscribe to yourself');
    }

    const [subscriber, target] = await Promise.all([
      this.userRepository.findOne({ where: { id: currentUserId } }),
      this.userRepository.findOne({ where: { id: targetUserId } }),
    ]);

    if (!subscriber || !target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.subscriptionRepository.findOne({
      where: {
        subscriber: { id: currentUserId },
        target: { id: targetUserId },
      },
    });

    if (existing) {
      throw new ConflictException('Already subscribed');
    }

    const subscription = this.subscriptionRepository.create({
      subscriber,
      target,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findAll() {
    return this.subscriptionRepository.find({
      relations: ['subscriber', 'target'],
    });
  }

  async findMySubscriptions(currentUserId: number) {
    return this.subscriptionRepository.find({
      where: {
        subscriber: { id: currentUserId },
      },
      relations: ['target'],
    });
  }

  async unsubscribe(currentUserId: number, targetUserId: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        subscriber: { id: currentUserId },
        target: { id: targetUserId },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.subscriptionRepository.remove(subscription);

    return { message: 'Unsubscribed' };
  }
}