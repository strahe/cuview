<script setup lang="ts">
import BaseModal from "@/components/ui/BaseModal.vue";
import type { Mk20DealDetail } from "@/types/market";
import { unwrapSqlNullableNumber, unwrapSqlNullableString } from "@/utils/sql";

interface Props {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  deal?: Mk20DealDetail | null;
}

interface Emits {
  (e: "close"): void;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  deal: null,
});

const emit = defineEmits<Emits>();

const extractPieceCid = (payload: Mk20DealDetail | null | undefined) => {
  const maybeCid = (payload?.deal as Record<string, unknown> | undefined)?.[
    "data"
  ] as Record<string, unknown> | undefined;
  const cidRecord = maybeCid?.piece_cid as { "/": string } | undefined;
  return cidRecord?.["/"] ?? null;
};

const extractIdentifier = (payload: Mk20DealDetail | null | undefined) => {
  const maybeDeal = payload?.deal as Record<string, unknown> | undefined;
  if (!maybeDeal) return null;
  const identifier = maybeDeal["identifier"];
  if (typeof identifier === "string") {
    return identifier;
  }
  if (
    identifier &&
    typeof identifier === "object" &&
    "/" in (identifier as Record<string, unknown>)
  ) {
    return (identifier as Record<string, string>)["/"];
  }
  return null;
};

const extractClient = (payload: Mk20DealDetail | null | undefined) => {
  const maybeDeal = payload?.deal as Record<string, unknown> | undefined;
  const client = maybeDeal?.["client"];
  return typeof client === "string" ? client : "Unknown";
};

const extractDdoId = (payload: Mk20DealDetail | null | undefined) => {
  const value = unwrapSqlNullableNumber(payload?.ddoid);
  return value !== null ? value.toString() : "N/A";
};

const prettyPrint = (value: unknown) => {
  if (!value) return "N/A";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatProductsPayload = (payload: Mk20DealDetail | null | undefined) => {
  const products = (payload?.deal as Record<string, unknown> | undefined)
    ?.products;
  return prettyPrint(products);
};

const formatRawDeal = (payload: Mk20DealDetail | null | undefined) => {
  return prettyPrint(payload?.deal);
};
</script>

<template>
  <BaseModal :open="open" title="Deal Details" size="lg" @close="emit('close')">
    <div v-if="loading" class="flex items-center justify-center py-10">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    <div v-else-if="error" class="alert alert-error my-4">
      <span>{{ error }}</span>
    </div>
    <div v-else-if="deal" class="space-y-6 py-6">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="bg-base-200/40 rounded-xl p-4">
          <p
            class="text-base-content/70 text-xs font-semibold tracking-wide uppercase"
          >
            Deal ID
          </p>
          <p class="text-base-content font-mono text-sm">
            {{ extractIdentifier(deal) || "Unknown" }}
          </p>
        </div>
        <div class="bg-base-200/40 rounded-xl p-4">
          <p
            class="text-base-content/70 text-xs font-semibold tracking-wide uppercase"
          >
            Client
          </p>
          <p class="text-base-content font-mono text-sm">
            {{ extractClient(deal) }}
          </p>
        </div>
        <div class="bg-base-200/40 rounded-xl p-4">
          <p
            class="text-base-content/70 text-xs font-semibold tracking-wide uppercase"
          >
            Piece CID
          </p>
          <p class="text-base-content font-mono text-sm">
            {{ extractPieceCid(deal) || "N/A" }}
          </p>
        </div>
        <div class="bg-base-200/40 rounded-xl p-4">
          <p
            class="text-base-content/70 text-xs font-semibold tracking-wide uppercase"
          >
            DDO Deal ID
          </p>
          <p class="text-base-content font-mono text-sm">
            {{ extractDdoId(deal) }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="bg-base-200/20 rounded-xl p-4">
          <p
            class="text-base-content/70 text-xs font-semibold tracking-wide uppercase"
          >
            DDO Error
          </p>
          <p class="text-error text-sm">
            {{ unwrapSqlNullableString(deal.ddoerr) || "None" }}
          </p>
        </div>
        <div class="bg-base-200/20 rounded-xl p-4">
          <p
            class="text-base-content/70 text-xs font-semibold tracking-wide uppercase"
          >
            PDP Error
          </p>
          <p class="text-error text-sm">
            {{ unwrapSqlNullableString(deal.pdperr) || "None" }}
          </p>
        </div>
      </div>

      <div>
        <h4 class="text-base-content mb-2 text-sm font-semibold uppercase">
          Products Payload
        </h4>
        <div
          class="bg-base-200/40 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap"
          v-text="formatProductsPayload(deal)"
        />
      </div>

      <div>
        <h4 class="text-base-content mb-2 text-sm font-semibold uppercase">
          Raw Deal Object
        </h4>
        <div
          class="bg-base-200/30 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap"
          v-text="formatRawDeal(deal)"
        />
      </div>
    </div>
    <div v-else class="text-base-content/70 py-6 text-center">
      No deal selected.
    </div>
  </BaseModal>
</template>
