<template>
  <div class="flex">
    <span class="flex flex-col w-full">
      <form-input-text
        :id="`${scope}-exercise-${index}`"
        v-model:value="data.title"
        label="Exercise"
        placeholder="Exercise"
      >
        <template v-slot:start-icon>
          <mobility-icon
            :size="14"
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

  <div
    v-for="(row, rowIndex) in data.sets"
    class="flex items-center ml-4 mt-2.5 last-of-type:mb-1"
  >
    <div class="flex items-center mr-4">
      <label
        :for="`${scope}-exercise-duration-${index}-${rowIndex}`"
        class="text-xs mr-1"
        >Duration</label
      >
      <input
        :id="`${scope}-exercise-duration-${index}-${rowIndex}`"
        class="border w-9 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
        v-model="row.duration"
      />
    </div>

    <button
      v-if="rowIndex !== data.sets.length - 1"
      class="flex items-center px-1 py-0.5 rounded-[3px] font-bold text-xs focus:outline focus:outline-slate-500 focus:outline-1"
      @click="removeSetsRow({ rowIndex })"
    >
      <close-icon :size="18" class="text-red-500 mr-px" />
    </button>

    <button
      v-if="rowIndex === data.sets.length - 1"
      class="flex items-center px-1 py-0.5 text-xs text-slate-800 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
      @click="addSetsRow()"
    >
      <add-icon :size="18" class="text-slate-800 mr-px" />
      <span class="mr-1.5">Add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import MobilityIcon from 'vue-material-design-icons/Meditation.vue';
import { ExerciseVariant, type ExerciseMobility } from '~/types/activity';

const props = defineProps<{
  index: number;
  data: ExerciseMobility;
  showAddExercise?: boolean;
  scope?: string;
  hideDelete?: boolean;
}>();

defineEmits<{
  (e: 'addExercise', variant: ExerciseVariant): void;
  (e: 'removeExercise', value: number): void;
}>();

async function addSetsRow() {
  const prevRow = props.data.sets[props.data.sets.length - 1];
  props.data.sets.push({
    idx: props.data.sets.length,
    duration: prevRow.duration
  });
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${props.scope}-exercise-duration-${props.index}-${
      props.data.sets.length - 1
    }`
  );
  el?.focus();
}

function removeSetsRow({ rowIndex }: { rowIndex: number }) {
  props.data.sets = props.data.sets
    .filter((_, i) => i !== rowIndex)
    .map((e, i) => {
      e.idx = i;
      return e;
    });
}
</script>
