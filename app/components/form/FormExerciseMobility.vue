<template>
  <div class="flex">
    <span class="flex flex-col w-full">
      <form-input-text
        :id="`${scope}-exercise-${index}`"
        v-model:value="data.title"
        label="Exercise"
        placeholder="Exercise"
        :required="true"
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
      <close-icon :size="18" class="text-red-500" />
    </button>
    <span v-if="hideDelete" class="ml-1 px-1 min-w-[26px]" />
  </div>
</template>

<script setup lang="ts">
import CloseIcon from 'vue-material-design-icons/Close.vue';
import MobilityIcon from 'vue-material-design-icons/Meditation.vue';
import { ExerciseVariant, type ExerciseMobility } from '~/types/activity';

defineProps<{
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
</script>
