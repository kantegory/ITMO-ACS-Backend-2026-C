import setupAccommodationListeners from './accommodation.listeners';

export async function initListeners(): Promise<void> {
  setupAccommodationListeners();
}