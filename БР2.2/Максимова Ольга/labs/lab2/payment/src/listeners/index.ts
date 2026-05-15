import setupPaymentListeners from './payment.listeners';

export async function initListeners(): Promise<void> {
  setupPaymentListeners();
}