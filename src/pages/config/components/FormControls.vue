<template>
  <div class="form-control">
    <!-- Duration Input -->
    <template v-if="type === 'duration'">
      <div class="flex gap-2">
        <input
          :value="durationNumber"
          type="number"
          min="0"
          class="input input-bordered flex-1"
          :placeholder="placeholder"
          @input="handleDurationInput"
        />
        <select
          :value="durationUnit"
          class="select select-bordered w-20"
          @change="handleDurationUnitChange"
        >
          <option value="s">sec</option>
          <option value="m">min</option>
          <option value="h">hour</option>
          <option value="d">day</option>
        </select>
      </div>
    </template>

    <!-- FIL Amount Input -->
    <template v-else-if="type === 'fil-amount'">
      <div class="flex gap-2">
        <input
          :value="filNumber"
          type="number"
          min="0"
          step="0.000000000000000001"
          class="input input-bordered flex-1"
          :placeholder="placeholder"
          @input="handleFilInput"
        />
        <select
          :value="filUnit"
          class="select select-bordered w-24"
          @change="handleFilUnitChange"
        >
          <option value="attofil">attoFIL</option>
          <option value="femtofil">femtoFIL</option>
          <option value="picofil">picoFIL</option>
          <option value="nanofil">nanoFIL</option>
          <option value="microfil">microFIL</option>
          <option value="millifil">milliFIL</option>
          <option value="fil">FIL</option>
        </select>
      </div>
    </template>

    <!-- Address List Input -->
    <template v-else-if="type === 'address-list'">
      <div class="space-y-2">
        <div
          v-for="(_address, index) in addressList"
          :key="index"
          class="flex gap-2"
        >
          <input
            v-model="addressList[index]"
            type="text"
            placeholder="f1... or f3... address"
            class="input input-bordered flex-1 font-mono text-sm"
            pattern="^f[13][a-zA-Z0-9]+"
            @input="updateAddressList"
          />
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="removeAddress(index)"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          @click="addAddress"
        >
          <PlusIcon class="mr-1 h-4 w-4" />
          Add Address
        </button>
      </div>
    </template>

    <!-- Regular Input -->
    <template v-else>
      <input
        :value="modelValue as string"
        :type="type"
        :placeholder="placeholder"
        class="input input-bordered"
        @input="handleRegularInput"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { XMarkIcon, PlusIcon } from "@heroicons/vue/24/outline";

interface Props {
  type:
    | "duration"
    | "fil-amount"
    | "address-list"
    | "text"
    | "number"
    | "email"
    | "url";
  modelValue: string | string[] | number;
  placeholder?: string;
}

interface DurationParsed {
  number: number;
  unit: string;
}

interface FilAmountParsed {
  number: number;
  unit: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: string | string[] | number];
}>();

// Duration handling
const durationNumber = ref(0);
const durationUnit = ref("s");

const parseDuration = (value: string): DurationParsed => {
  if (!value) return { number: 0, unit: "s" };

  const match = value.match(/^(\d+(?:\.\d+)?)\s*([smhd]?)$/);
  if (match) {
    return {
      number: parseFloat(match[1]),
      unit: match[2] || "s",
    };
  }
  return { number: 0, unit: "s" };
};

const handleDurationInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const number = parseFloat(target.value) || 0;
  durationNumber.value = number;
  updateDurationValue(number, durationUnit.value);
};

const handleDurationUnitChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const unit = target.value;
  durationUnit.value = unit;
  updateDurationValue(durationNumber.value, unit);
};

const updateDurationValue = (number: number, unit: string) => {
  const result = number > 0 ? `${number}${unit}` : "";
  emit("update:modelValue", result);
};

// FIL amount handling
const filNumber = ref(0);
const filUnit = ref("fil");

const parseFilAmount = (value: string): FilAmountParsed => {
  if (!value) return { number: 0, unit: "fil" };

  const units = [
    "attofil",
    "femtofil",
    "picofil",
    "nanofil",
    "microfil",
    "millifil",
    "fil",
  ];
  const lowerValue = value.toLowerCase();

  for (const unit of units) {
    if (lowerValue.endsWith(unit)) {
      const numberPart = lowerValue.slice(0, -unit.length).trim();
      return {
        number: parseFloat(numberPart) || 0,
        unit,
      };
    }
  }

  return { number: parseFloat(value) || 0, unit: "fil" };
};

const handleFilInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const number = parseFloat(target.value) || 0;
  filNumber.value = number;
  updateFilValue(number, filUnit.value);
};

const handleFilUnitChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const unit = target.value;
  filUnit.value = unit;
  updateFilValue(filNumber.value, unit);
};

const updateFilValue = (number: number, unit: string) => {
  const result = number > 0 ? `${number}${unit}` : "";
  emit("update:modelValue", result);
};

// Address list handling
const addressList = ref<string[]>([]);

const updateAddressList = () => {
  const filtered = addressList.value.filter((addr) => addr.trim() !== "");
  emit("update:modelValue", filtered);
};

const addAddress = () => {
  addressList.value.push("");
};

const removeAddress = (index: number) => {
  addressList.value.splice(index, 1);
  updateAddressList();
};

// Regular input handling
const handleRegularInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};

// Initialize values based on type
watch(
  () => props.modelValue,
  (newValue) => {
    if (props.type === "duration" && typeof newValue === "string") {
      const parsed = parseDuration(newValue);
      durationNumber.value = parsed.number;
      durationUnit.value = parsed.unit;
    } else if (props.type === "fil-amount" && typeof newValue === "string") {
      const parsed = parseFilAmount(newValue);
      filNumber.value = parsed.number;
      filUnit.value = parsed.unit;
    } else if (props.type === "address-list") {
      addressList.value = Array.isArray(newValue) ? [...newValue] : [];
      if (addressList.value.length === 0) {
        addressList.value.push("");
      }
    }
  },
  { immediate: true },
);
</script>
