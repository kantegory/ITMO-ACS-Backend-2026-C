import { subscribe, publish, Topics } from "common";
import type {
  RentCreated,
  RentCancelled,
  RentFailed,
  RentConfirmed,
} from "common";
import { accommodationService } from "../services";

export default async function setupAccommodationListeners() {
  await subscribe<RentCancelled | RentFailed | RentCreated | RentConfirmed>(
    Topics.Rent,
    async (msg) => {
      if (msg.eventType === "rent.created") {
        const { rentId, accommodationId, startDate, endDate } = msg as RentCreated;
        try {
          await accommodationService.blockDates(
            accommodationId,
            startDate,
            endDate,
            rentId,
          );

          await publish(Topics.Accommodation, {
            eventType: "accommodation.blocked",
            rentId,
            accommodationId,
            startDate,
            endDate,
            timestamp: Date.now(),
          });
        } catch (e: any) {
          await publish(Topics.Accommodation, {
            eventType: "accommodation.block.failed",
            rentId,
            accommodationId,
            startDate,
            endDate,
            reason: e.message,
            timestamp: Date.now(),
          });
        }
        return;
      }

      if (msg.eventType === "rent.confirmed") {
        const { rentId, accommodationId } = msg as RentConfirmed;
        try {

          await publish(Topics.Accommodation, {
            eventType: "accommodation.rented",
            rentId,
            accommodationId,
            timestamp: Date.now(),
          });
        } catch (e: any) {
          await publish(Topics.Accommodation, {
            eventType: "accommodation.rent.failed",
            rentId,
            accommodationId,
            reason: e.message,
            timestamp: Date.now(),
          });
        }
        return;
      }

      if (msg.eventType === "rent.cancelled" || msg.eventType === "rent.failed") {
        const { rentId } = msg as RentCancelled | RentFailed;
        try {
          const booking = await accommodationService.findBookingByRentId(rentId);
          if (booking) {
            await accommodationService.unblockDates(
              booking.accommodationId,
              booking.startDate,
              booking.endDate,
            );

            await publish(Topics.Accommodation, {
              eventType: "accommodation.unblocked",
              rentId,
              accommodationId: booking.accommodationId,
              startDate: booking.startDate,
              endDate: booking.endDate,
              timestamp: Date.now(),
            });
          }
        } catch (e) {
          console.error("Unblock failed", e);
        }
      }
    },
  );
}