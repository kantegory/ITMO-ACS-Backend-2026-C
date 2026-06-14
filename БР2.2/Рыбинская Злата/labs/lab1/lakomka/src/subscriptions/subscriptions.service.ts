import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class SubscriptionsService {
  private subscriptions: any[] = [];

  subscribe(data: any) {
    const sub = {
      id: this.subscriptions.length + 1,
      ...data
    };

    this.subscriptions.push(sub);
    return sub;
  }

  findAll() {
    return this.subscriptions;
  }

  unsubscribe(id: number) {
    const exists = this.subscriptions.some(s => s.id === id);

    if (!exists) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
    return { message: 'Unsubscribed' };
  }
}