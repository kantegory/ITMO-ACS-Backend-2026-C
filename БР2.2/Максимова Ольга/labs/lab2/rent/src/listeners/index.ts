import setupRentListeners from './rent.listeners';

export async function initListeners(): Promise<void> {
  await setupRentListeners();
}