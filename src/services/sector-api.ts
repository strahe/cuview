import type { CurioApiService } from "@/services/curio-api";
import type { SectorListItem, SectorTerminationPayload } from "@/types/sectors";

export interface SectorListResponse {
  data: SectorListItem[];
}

export function normalizeSectorListResponse(
  response: SectorListResponse | null | undefined,
): SectorListItem[] {
  return response?.data ?? [];
}

export async function fetchSectors(
  api: CurioApiService,
  signal?: AbortSignal,
): Promise<SectorListItem[]> {
  const response = await api.restGet<SectorListResponse>("/api/sector/all", {
    signal,
  });
  return normalizeSectorListResponse(response);
}

export async function terminateSectors(
  api: CurioApiService,
  payload: SectorTerminationPayload[],
): Promise<void> {
  await api.restPost("/api/sector/terminate", payload);
}
