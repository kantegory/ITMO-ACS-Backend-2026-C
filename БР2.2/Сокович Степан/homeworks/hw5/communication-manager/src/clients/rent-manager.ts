import { config } from "../config";
import { rpcCall } from "../kafka-rpc-client";

export async function assertListingExists(listingId: string): Promise<boolean> {
  const response = await rpcCall<{ listingId: string }, { exists?: boolean }>(config.rentRpcTopic, "listings.exists", {
    listingId,
  });
  return response?.exists === true;
}

export async function assertDealVisible(dealId: string, userId: string): Promise<boolean> {
  const response = await rpcCall<{ dealId: string; userId: string }, { visible?: boolean }>(
    config.rentRpcTopic,
    "deals.visible",
    { dealId, userId }
  );
  return response?.visible === true;
}
