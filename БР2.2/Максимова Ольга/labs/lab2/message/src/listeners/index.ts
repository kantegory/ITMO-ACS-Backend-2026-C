import setupMessageListeners from './message.listeners';

export async function initListeners(): Promise<void> {
  setupMessageListeners();
}