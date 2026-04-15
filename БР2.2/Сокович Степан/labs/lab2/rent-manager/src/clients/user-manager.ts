import axios from "axios";
import { config } from "../config";

const internalAxios = axios.create({
  baseURL: config.userManagerUrl,
  headers: { Authorization: `Bearer ${config.internalToken}` },
  validateStatus: () => true,
});

export async function assertUsersExist(ids: string[]): Promise<boolean> {
  const q = ids.join(",");
  const r = await internalAxios.get(`/internal/users/exists?ids=${encodeURIComponent(q)}`);
  if (r.status !== 200 || !r.data?.exists) {
    return false;
  }
  return ids.every((id) => r.data.exists[id] === true);
}
