<route>
{
  "meta": {
    "title": "PDP"
  }
}
</route>

<script setup lang="ts">
import PdpServicesCard from "./components/PdpServicesCard.vue";
import PdpKeysCard from "./components/PdpKeysCard.vue";
import PdpPipelinesCard from "./components/PdpPipelinesCard.vue";
</script>

<template>
  <div class="space-y-6 p-6">
    <PdpServicesCard />
    <PdpKeysCard />
    <PdpPipelinesCard />
  </div>
</template>
