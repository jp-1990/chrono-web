<template>
  <div class="flex">
    <span class="flex flex-col w-full">
      <form-input-text
        :id="`${scope}-exercise-${index}`"
        v-model="data.title"
        label="Exercise"
        placeholder="Exercise"
      >
        <template v-slot:start-icon>
          <strength-icon
            :size="10"
            class="flex justify-center items-center mt-1 mr-1 w-4 h-4 bg-slate-700 text-slate-50 rounded-[3px]"
          />
        </template>
      </form-input-text>
    </span>
    <span
      v-if="index === 0"
      class="flex items-center w-[18px] ml-2 mr-1 font-bold text-xs"
    />
    <button
      v-if="index > 0"
      class="flex items-center mt-[32px] ml-1 mb-1 px-1 font-bold rounded-[3px] text-xs focus:outline focus:outline-slate-500 focus:outline-1"
      @click="$emit('removeExercise', index)"
    >
      <close-icon :size="18" class="text-slate-500" />
    </button>
  </div>

  <div
    v-for="(row, rowIndex) in data.sets"
    class="flex items-center ml-4 mt-2.5 last-of-type:mb-1"
  >
    <div class="flex items-center mr-4">
      <label
        :for="`${scope}-exercise-reps-${index}-${rowIndex}`"
        class="text-xs mr-1"
        >Reps</label
      >
      <input
        :id="`${scope}-exercise-reps-${index}-${rowIndex}`"
        class="border w-9 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
        v-model="row.reps"
      />
    </div>
    <div class="flex items-center mr-4">
      <label
        :for="`${scope}-exercise-weight-${index}-${rowIndex}`"
        class="text-xs mr-1"
        >Weight</label
      >
      <input
        :id="`${scope}-exercise-weight-${index}-${rowIndex}`"
        class="border w-9 h-6 py-1 px-1.5 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
        v-model="row.weight"
      /><span class="font-light text-[10px] text-slate-300 ml-0.5">kg</span>
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
  <div
    v-if="showAddExercise"
    class="flex items-center self-start ml-1.5 mt-4 my-2.5"
  >
    <button
      class="relative p-0.5 mr-1.5 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
      @click="$emit('addExercise', ExerciseVariant.STRENGTH)"
    >
      <strength-icon
        :size="16"
        class="flex justify-center items-center w-7 h-7 bg-slate-700 text-slate-50 rounded-[3px]"
      />
      <add-icon
        :size="12"
        class="absolute z-10 top-0 right-0 flex justify-center items-center w-3 h-3 bg-slate-500 text-white border-[0.5px] border-slate-700 rounded-[2px]"
      />
    </button>
    <button
      class="relative p-0.5 mr-1.5 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
      @click="$emit('addExercise', ExerciseVariant.CARDIO)"
    >
      <cardio-icon
        :size="18"
        class="flex justify-center items-center w-7 h-7 bg-slate-700 text-slate-50 rounded-[3px]"
      />
      <add-icon
        :size="12"
        class="absolute z-10 top-0 right-0 flex justify-center items-center w-3 h-3 bg-slate-500 text-white border-[0.5px] border-slate-700 rounded-[2px]"
      />
    </button>
    <button
      class="relative p-0.5 mr-1.5 rounded-[3px] focus:outline focus:outline-slate-500 focus:outline-1"
      @click="$emit('addExercise', ExerciseVariant.MOBILITY)"
    >
      <mobility-icon
        :size="20"
        class="flex justify-center items-center w-7 h-7 bg-slate-700 text-slate-50 rounded-[3px]"
      />
      <add-icon
        :size="12"
        class="absolute z-10 top-0 right-0 flex justify-center items-center w-3 h-3 bg-slate-500 text-white border-[0.5px] border-slate-700 rounded-[2px]"
      />
    </button>
    <span class="ml-1.5 text-sm text-slate-700">Add another exercise</span>
  </div>
</template>

<script setup lang="ts">
import AddIcon from 'vue-material-design-icons/Plus.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import StrengthIcon from 'vue-material-design-icons/Dumbbell.vue';
import CardioIcon from 'vue-material-design-icons/Run.vue';
import MobilityIcon from 'vue-material-design-icons/Meditation.vue';
import {
  ExerciseVariant,
  type ExerciseMobility,
  type ExerciseStrength
} from '~/types/activity';

const props = defineProps<{
  index: number;
  data: ExerciseStrength | ExerciseMobility;
  showAddExercise?: boolean;
  scope?: string;
}>();

defineEmits<{
  (e: 'addExercise', variant: ExerciseVariant): void;
  (e: 'removeExercise', value: number): void;
}>();

async function addSetsRow() {
  const prevRow = props.data.sets[props.data.sets.length - 1];
  props.data.sets.push({
    idx: props.data.sets.length,
    reps: prevRow.reps,
    weight: prevRow.weight
  });
  await nextTick();
  const el: HTMLInputElement | null = document.querySelector(
    `#${props.scope}-exercise-reps-${props.index}-${props.data.sets.length - 1}`
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
