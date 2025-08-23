import type { ConnectionTestResult } from '@/types/config';

export const getConnectionErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED')) {
      return 'Connection refused. Please check if the server is running.';
    }
    if (error.message.includes('ETIMEDOUT')) {
      return 'Connection timeout. Please check your network or server status.';
    }
    if (error.message.includes('ENOTFOUND')) {
      return 'Host not found. Please verify the endpoint URL.';
    }
    return error.message;
  }
  return 'Unknown connection error occurred.';
};

export const testConnectionWithDetails = async (
  endpoint: string,
  timeout: number = 10000
): Promise<ConnectionTestResult> => {
  const startTime = Date.now();
  
  try {
    const { CurioApiService } = await import("@/services/curio-api");
    const testApi = new CurioApiService({ endpoint, timeout });
    
    await testApi.connect();
    await testApi.call("Version");
    testApi.disconnect();
    
    return {
      success: true,
      latency: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: getConnectionErrorMessage(error),
      latency: Date.now() - startTime
    };
  }
};