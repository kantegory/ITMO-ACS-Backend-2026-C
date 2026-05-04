import { subscribe, publish, Topics } from "common";
import type {
  AccommodationBlocked,
  PaymentProcessed,
  PaymentFailed,
} from "common";
import { rentService } from "../services";

export default async function setupRentListeners() {
  await subscribe<AccommodationBlocked>(Topics.Accommodation, async (msg) => {
    if (msg.eventType === "accommodation.blocked") {
      await rentService.markAsPendingPayment(msg.rentId);
    }
  });

  await subscribe<PaymentProcessed>(Topics.Payment, async (msg) => {
    if (msg.eventType === "payment.processed") {
      await rentService.handlePaymentCaptured(msg.rentId);
        await publish(Topics.Rent, {
        eventType: "rent.confirmed",
        rentId: msg.rentId,
        timestamp: Date.now(),
      });
    }
  });

  await subscribe<PaymentFailed>(Topics.Payment, async (msg) => {
    if (msg.eventType === "payment.failed") {
      await rentService.handlePaymentFailure(msg.rentId, msg.reason);
      await publish(Topics.Rent, {
        eventType: "rent.failed",
        rentId: msg.rentId,
        step: "payment_hold",
        status: msg.reason,
        timestamp: Date.now(),
      });
    }
  });
}
