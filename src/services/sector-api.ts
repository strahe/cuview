import { useCurioApi } from "@/composables/useCurioQuery";
import type { SectorListItem, SectorTerminationPayload } from "@/types/sectors";

interface SectorListResponse {
  data: SectorListItem[];
}

export async function fetchSectors(
  signal?: AbortSignal,
): Promise<SectorListItem[]> {
  const api = useCurioApi();
  const response = await api.restGet<SectorListResponse>("/api/sector/all", {
    signal,
  });
  return response?.data ?? [];
}

export async function terminateSectors(
  payload: SectorTerminationPayload[],
): Promise<void> {
  const api = useCurioApi();
  await api.restPost("/api/sector/terminate", payload);
}
