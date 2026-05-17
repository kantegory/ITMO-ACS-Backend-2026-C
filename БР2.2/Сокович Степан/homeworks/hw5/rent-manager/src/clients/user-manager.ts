import { config } from "../config";
import { rpcCall } from "../kafka-rpc-client";

export async function assertUsersExist(ids: string[]): Promise<boolean> {
  const response = await rpcCall<{ ids: string[] }, { exists?: Record<string, boolean> }>(
    config.userRpcTopic,
    "users.exists",
    { ids }
  );
  if (!response?.exists) {
    return false;
  }
  return ids.every((id) => response.exists?.[id] === true);
}
