import setupUserListeners from './user.listeners';

export async function initListeners(): Promise<void> {
  await setupUserListeners();
}