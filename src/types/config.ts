export interface EndpointConfig {
  endpoint: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  latency?: number;
}