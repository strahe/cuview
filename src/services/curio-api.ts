import { JsonRpcClient, createJsonRpcClient } from "@/lib/jsonrpc-client";
import type { JsonRpcClientEvents } from "@/lib/jsonrpc-client";
import { createRestClient } from "@/lib/rest-client";
import type { RestClient } from "@/lib/rest-client";
import { useConfigStore } from "@/stores/config";
import type {
  ConfigLayer,
  ConfigSchema,
  DefaultConfig,
  TopologyNode,
  AddLayerRequest,
  Sector,
  SectorsResponse,
  TerminateSectorRequest,
} from "@/types/api";

export class CurioApiService {
  private client: JsonRpcClient;
  private restClient: RestClient;
  private readonly baseURL: string;

  constructor(options?: {
    endpoint?: string;
    timeout?: number;
    enableAutoReconnect?: boolean;
  }) {
    const configStore = useConfigStore();
    const endpoint = options?.endpoint || configStore.getEndpoint();

    const enableAutoReconnect = options?.enableAutoReconnect ?? true;

    this.client = createJsonRpcClient({
      endpoint,
      timeout: options?.timeout || 30000,
      methodPrefix: "CurioWeb.",
      reconnectInterval: enableAutoReconnect ? 1000 : 0,
      maxReconnectAttempts: enableAutoReconnect ? 10 : 0,
    });

    this.baseURL = this.getRestBaseURL(endpoint);
    this.restClient = createRestClient({
      baseURL: this.baseURL,
      timeout: options?.timeout || 30000,
    });
  }

  private getRestBaseURL(jsonrpcEndpoint: string): string {
    if (
      jsonrpcEndpoint.startsWith("ws://") ||
      jsonrpcEndpoint.startsWith("wss://")
    ) {
      const protocol = jsonrpcEndpoint.startsWith("wss://")
        ? "https://"
        : "http://";
      const urlWithoutProtocol = jsonrpcEndpoint.replace(/^wss?:\/\//, "");
      const baseUrl = urlWithoutProtocol.replace(/\/api\/webrpc\/v0.*$/, "");
      return `${protocol}${baseUrl}/api`;
    }

    if (jsonrpcEndpoint.startsWith("/api/webrpc/v0")) {
      return "/api";
    }

    return `${window.location.protocol}//${window.location.host}/api`;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  get isConnected(): boolean {
    return this.client.isConnected;
  }

  on<K extends keyof JsonRpcClientEvents>(
    event: K,
    callback: JsonRpcClientEvents[K],
  ): void {
    this.client.on(event, callback);
  }

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    return this.client.call<T>(method, params);
  }

  // REST API methods for Config
  async getConfigLayers(): Promise<string[]> {
    const response = await this.restClient.get<string[]>("/config/layers");
    return response.data;
  }

  async getConfigLayer(layerName: string): Promise<ConfigLayer> {
    const response = await this.restClient.get<ConfigLayer>(
      `/config/layers/${encodeURIComponent(layerName)}`,
    );
    return response.data;
  }

  async setConfigLayer(layerName: string, config: ConfigLayer): Promise<void> {
    await this.restClient.post(
      `/config/layers/${encodeURIComponent(layerName)}`,
      config,
    );
  }

  async addConfigLayer(layerName: string): Promise<void> {
    const request: AddLayerRequest = { Name: layerName };
    await this.restClient.post("/config/addlayer", request);
  }

  async getConfigSchema(): Promise<ConfigSchema> {
    const response = await this.restClient.get<ConfigSchema>("/config/schema");
    return response.data;
  }

  async getDefaultConfig(): Promise<DefaultConfig> {
    const response =
      await this.restClient.get<DefaultConfig>("/config/default");
    return response.data;
  }

  async getTopology(): Promise<TopologyNode[]> {
    const response = await this.restClient.get<TopologyNode[]>("/config/topo");
    return response.data;
  }

  // REST API methods for Sectors
  async getAllSectors(): Promise<Sector[]> {
    const response = await this.restClient.get<SectorsResponse>("/sector/all");
    return response.data.data;
  }

  async terminateSectors(sectors: TerminateSectorRequest[]): Promise<void> {
    await this.restClient.post("/sector/terminate", sectors);
  }

  async terminateSector(
    minerAddress: string,
    sectorNumber: number,
  ): Promise<void> {
    const request: TerminateSectorRequest = {
      MinerAddress: minerAddress,
      Sector: sectorNumber,
    };
    return this.terminateSectors([request]);
  }
}
