import type { CurioApiService } from "@/services/curio-api";
import type { SectorListItem, SectorTerminationPayload } from "@/types/sectors";

interface SectorListResponse {
  data: SectorListItem[];
}

export async function fetchSectors(
  api: CurioApiService,
  signal?: AbortSignal,
): Promise<SectorListItem[]> {
  const response = await api.restGet<SectorListResponse>("/api/sector/all", {
    signal,
  });
  return response?.data ?? [];
}

export async function terminateSectors(
  api: CurioApiService,
  payload: SectorTerminationPayload[],
): Promise<void> {
  await api.restPost("/api/sector/terminate", payload);
}
