import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "./-components/add-client-dialog";
import { ClientMessagesCard } from "./-components/client-messages-card";
import { ClientRequestsCard } from "./-components/client-requests-card";
import { ClientSettingsCard } from "./-components/client-settings-card";
import { ClientWalletsCard } from "./-components/client-wallets-card";
import { RouterBalanceCard } from "./-components/router-balance-card";
import { TosCard } from "./-components/tos-card";
import {
  usePsClientGet,
  usePsClientMessages,
  usePsClientWallets,
  usePsTos,
} from "./-module/queries";

export const Route = createFileRoute("/_app/proof-share/client")({
  component: ClientPage,
});

function ClientPage() {
  const { data: clients, isLoading: clientsLoading } = usePsClientGet();
  const { data: wallets, isLoading: walletsLoading } = usePsClientWallets();
  const { data: messages } = usePsClientMessages();
  const { data: tos } = usePsTos();

  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <div className="space-y-6">
      <ClientSettingsCard
        clients={clients ?? []}
        loading={clientsLoading}
        headerAction={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddClient(true)}
          >
            <Plus className="mr-1 size-4" /> Add Client
          </Button>
        }
      />

      <ClientWalletsCard wallets={wallets ?? []} loading={walletsLoading} />
      <ClientRequestsCard />
      <RouterBalanceCard />
      <ClientMessagesCard messages={messages ?? []} />
      {tos && <TosCard tos={tos} />}

      <AddClientDialog open={showAddClient} onOpenChange={setShowAddClient} />
    </div>
  );
}
