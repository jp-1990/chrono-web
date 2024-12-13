<template>
  <section class="flex flex-col">
    <div class="flex flex-col">
      <div class="flex">
        <span class="flex flex-col w-full">
          <form-input-text
            :id="`${scope}-exercise-${index}`"
            v-model:value="data.title"
            label="Exercise"
            placeholder="Exercise"
          >
            <template v-slot:start-icon>
              <cardio-icon
                :size="12"
                class="flex justify-center items-center mt-1 mr-1 w-4 h-4 bg-slate-700 text-slate-50 rounded-[3px]"
              />
            </template>
          </form-input-text>
        </span>
        <button
          v-if="!hideDelete"
          class="flex items-center mt-[32px] ml-1 mb-1 px-1 font-bold rounded-[3px] text-xs focus:outline focus:outline-slate-500 focus:outline-1"
          @click="$emit('removeExercise', index)"
        >
          <close-icon :size="18" class="text-slate-500" />
        </button>
        <span v-if="hideDelete" class="ml-1 px-1 w-[18px]" />
      </div>

      <div class="flex items-center ml-4 mt-2.5">
        <label :for="`${scope}-distance-${index}`" class="text-xs w-16"
          >Distance</label
        >
        <input
          :id="`${scope}-distance-${index}`"
          class="border w-10 h-7 sm:h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
          v-model="data.distance"
          @keypress="preventNonNumericInput"
        />
        <span
          class="font-light text-xs sm:text-[10px] text-slate-300 ml-1 sm:ml-0.5"
          >km</span
        >
      </div>
      <div class="flex items-center w-full justify-between ml-4 mt-2">
        <form-input-duration
          :id="`${scope}-exercise-${index}`"
          v-model="data.duration"
          label="Time"
        />

        <button
          v-if="data.splits.length === 0"
          class="flex items-center mt-2 px-1 mr-[18px] h-6 text-xs text-slate-800 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
          @click="addSplitsRow()"
        >
          <add-icon :size="18" class="text-slate-800 mr-px" />
          <span class="mr-1.5">Add Splits</span>
        </button>
        <button
          v-if="data.splits.length > 0"
          class="flex items-center mt-2 px-1 mr-[18px] h-6 text-xs text-red-500 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
          @click="removeAllSplits()"
        >
          <close-icon :size="18" class="text-red-500 mr-px" />
          <span class="mr-1.5">Remove Splits</span>
        </button>
      </div>
    </div>
  </section>

  <section v-if="data.splits.length">
    <div class="flex mt-4 justify-between">
      <label class="text-xs">Splits</label>
      <!-- <span class="ml-1 mr-7 text-xs font-light text-slate-500" -->
      <!--   >[ Avg. pace: TODO ]</span -->
      <!-- > -->
    </div>

    <div
      v-for="(row, rowIndex) in data.splits"
      :class="[rowIndex === 0 ? 'mt-1.5' : 'mt-2.5']"
      class="flex items-center ml-4 last-of-type:mb-1"
    >
      <div class="flex items-center mr-4">
        <label
          :for="`${scope}-distance-${index}-${rowIndex}`"
          class="text-xs ml-1 mr-1.5"
          >Distance</label
        >
        <input
          :id="`${scope}-distance-${index}-${rowIndex}`"
          class="border w-10 h-7 sm:h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
          v-model="row.distance"
          @keypress="preventNonNumericInput"
        />
        <span
          class="font-light text-xs sm:text-[10px] text-slate-300 ml-1 sm:ml-0.5"
          >km</span
        >

        <div class="[&_div_>_label]:w-auto [&_div_>_label]:mr-1.5 ml-4">
          <form-input-duration
            :id="`${scope}-exercise-${index}`"
            v-model="row.duration"
            label="Time"
          />
        </div>
      </div>

      <button
        v-if="rowIndex !== data.splits.length - 1"
        class="flex items-center px-1 py-0.5 rounded-[3px] font-bold text-xs focus:outline focus:outline-slate-500 focus:outline-1"
        @click="
          removeSplitsRow({
            rowIndex
          })
        "
      >
        <close-icon :size="18" class="text-red-500 mr-px" />
      </button>

      <button
        v-if="rowIndex === data.splits.length - 1"
        class="flex items-center px-1 py-0.5 text-xs text-slate-800 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
        @click="addSplitsRow()"
      >
        <add-icon :size="18" class="text-slate-800 mr-px" />
        <span class="mr-1.5">Add</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import CardioIcon from 'vue-material-design-icons/Run.vue';
import { ExerciseVariant, type ExerciseCardio } from '~/types/activity';
import { preventNonNumericInput } from '~/utils/ui';

const props = defineProps<{
  index: number;
  data: ExerciseCardio;
  scope?: string;
  hideDelete?: boolean;
}>();

defineEmits<{
  (e: 'addExercise', variant: ExerciseVariant): void;
  (e: 'removeExercise', value: number): void;
}>();

async function addSplitsRow() {
  const prevRow = props.data.splits[props.data.splits.length - 1];
  props.data.splits.push({
    idx: props.data.splits.length,
    distance: prevRow?.distance ?? undefined,
    duration: prevRow?.duration ?? undefined
  });
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${props.scope}-pace-${props.index}-${props.data.splits.length - 1}`
  );
  el?.focus();
}

const removeSplitsRow = ({ rowIndex }: { rowIndex: number }) => {
  props.data.splits = props.data.splits
    .filter((_, i) => i !== rowIndex)
    .map((e, i) => {
      e.idx = i;
      return e;
    });
};

function removeAllSplits() {
  props.data.splits = [];
}
</script>
