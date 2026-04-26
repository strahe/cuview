import { createJsonRpcClient } from "@/lib/jsonrpc-client";
import { logClientError } from "@/utils/error-log";

export const testEndpointConnection = async (
  endpoint: string,
  timeout: number = 10000,
): Promise<boolean> => {
  let client = null;

  try {
    client = createJsonRpcClient({
      endpoint,
      timeout,
      methodPrefix: "CurioWeb.",
      reconnectInterval: 0,
      maxReconnectAttempts: 0,
    });

    await client.connect();
    await client.call("Version");
    return true;
  } catch (err) {
    logClientError("Connection test failed:", err);
    return false;
  } finally {
    if (client) {
      client.disconnect();
      client = null;
    }
  }
};
