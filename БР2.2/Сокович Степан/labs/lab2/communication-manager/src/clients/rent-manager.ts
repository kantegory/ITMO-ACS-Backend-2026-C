import axios from "axios";
import { config } from "../config";

const rentAxios = axios.create({
  baseURL: config.rentManagerUrl,
  validateStatus: () => true,
});

export async function assertListingExists(listingId: string): Promise<boolean> {
  const r = await rentAxios.get(`/listings/${listingId}`);
  return r.status === 200;
}

export async function assertDealVisible(dealId: string, bearerAuthHeader: string): Promise<boolean> {
  const r = await rentAxios.get("/deals", {
    headers: { Authorization: bearerAuthHeader },
  });
  if (r.status !== 200 || !Array.isArray(r.data?.data)) {
    return false;
  }
  return r.data.data.some((d: { id: string }) => d.id === dealId);
}
