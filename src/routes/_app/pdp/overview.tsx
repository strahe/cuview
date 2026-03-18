import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { FsRegistryCard } from "./-components/fs-registry-card";
import { KeysCard } from "./-components/keys-card";
import { ServicesCard } from "./-components/services-card";
import {
  useFsRegistryStatus,
  usePdpKeys,
  usePdpPipelines,
  usePdpServices,
} from "./-module/queries";

export const Route = createFileRoute("/_app/pdp/overview")({
  component: PdpOverview,
});

function PdpOverview() {
  const { data: services, isLoading: servicesLoading } = usePdpServices();
  const { data: keys, isLoading: keysLoading } = usePdpKeys();
  const { data: pipelines } = usePdpPipelines(100, 0);
  const { data: fsStatus } = useFsRegistryStatus();

  const pipelineLimit = 100;
  const stats = useMemo(() => {
    const list = pipelines ?? [];
    return {
      total: list.length,
      active: list.filter((p) => !p.complete).length,
      capped: list.length >= pipelineLimit,
    };
  }, [pipelines]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Services" value={services?.length ?? 0} />
        <KPICard label="Keys" value={keys?.length ?? 0} />
        <KPICard
          label="Pipelines"
          value={stats.capped ? `${stats.total}+` : stats.total}
        />
        <KPICard
          label="Active"
          value={stats.capped ? `${stats.active}+` : stats.active}
        />
      </div>

      <ServicesCard services={services ?? []} loading={servicesLoading} />
      <KeysCard keys={keys ?? []} loading={keysLoading} />
      <FsRegistryCard fsStatus={fsStatus} />
    </div>
  );
}
