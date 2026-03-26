import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { AddRuleDialog } from "./-components/add-rule-dialog";
import { balanceRuleColumns } from "./-components/balance-rule-columns";
import { EditRuleDialog } from "./-components/edit-rule-dialog";
import { useBalanceRules, useRemoveBalanceRule } from "./-module/queries";
import type { BalanceRuleView } from "./-module/types";

export const Route = createFileRoute("/_app/wallets/balance-manager")({
  component: WalletBalanceManagerPage,
});

type SubjectType = "wallet" | "proofshare" | "f05";

export function WalletBalanceManagerPage() {
  const rulesQuery = useBalanceRules();
  const removeRule = useRemoveBalanceRule();
  const [addingRuleType, setAddingRuleType] = useState<SubjectType | null>(
    null,
  );
  const [editingRule, setEditingRule] = useState<BalanceRuleView | null>(null);

  const rules = rulesQuery.data ?? [];

  const columns = useMemo<ColumnDef<BalanceRuleView>[]>(
    () => [
      ...balanceRuleColumns,
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Edit rule"
              aria-label="Edit rule"
              onClick={() => setEditingRule(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              title="Remove rule"
              aria-label="Remove rule"
              disabled={removeRule.isPending}
              onClick={() => removeRule.mutate([row.original.id])}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [removeRule],
  );

  return (
    <div className="space-y-4">
      <SectionCard
        title="Balance Manager Rules"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAddingRuleType("wallet")}>
              <Plus className="mr-1 size-4" />
              Add Wallet Rule
            </Button>
            <Button size="sm" onClick={() => setAddingRuleType("proofshare")}>
              <Plus className="mr-1 size-4" />
              Add SnarkMarket Client Rule
            </Button>
            <Button size="sm" onClick={() => setAddingRuleType("f05")}>
              <Plus className="mr-1 size-4" />
              Add F05 Rule
            </Button>
          </div>
        }
      >
        {rulesQuery.isError ? (
          <p className="text-sm text-destructive">
            {(rulesQuery.error as Error)?.message ??
              "Failed to load balance manager rules."}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={rules}
            loading={rulesQuery.isLoading}
            searchable
            emptyMessage="No balance rules configured."
          />
        )}
      </SectionCard>

      {addingRuleType ? (
        <AddRuleDialog
          open
          initialSubjectType={addingRuleType}
          onOpenChange={(open) => {
            if (!open) {
              setAddingRuleType(null);
            }
          }}
        />
      ) : null}

      {editingRule ? (
        <EditRuleDialog
          open
          ruleId={editingRule.id}
          currentLow={editingRule.lowWatermark}
          currentHigh={editingRule.highWatermark}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRule(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
