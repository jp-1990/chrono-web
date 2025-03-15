<template>
  <div ref="container" id="item-row" class="flex h-full w-full relative">
    <div
      v-if="ids"
      v-for="(id, index) in ids || []"
      v-on:mouseup="$emit('itemClick', $event, items?.[id])"
      :key="id"
      :style="`${items?.[id].style} background-color:${
        user.activities[items?.[id].title ?? ''] ?? DEFAULT_COLOR
      }`"
      :id="`${items?.[id].id}-${index}-${id}-container`"
      class="h-full py-0.5 rounded-sm flex overflow-hidden absolute animate-fade-in"
    >
      <div
        v-if="items?.[id].isStart"
        class="bg-transparent w-1 h-full cursor-ew-resize"
      >
        <div
          v-on:mousedown.left.self="
            $emit(
              'changeItemStartTime',
              $event,
              Handles.START,
              containerRect,
              items?.[id],
              getPrevEnd(index),
              items?.[id].endPercentage
            )
          "
          :id="`${items?.[id].id}-${index}-${id}-start`"
          class="h-full w-full"
        ></div>
      </div>
      <div
        :id="`${items?.[id].id}-${index}-${id}-duration`"
        class="flex-1 bg-transparent h-full overflow-hidden"
      ></div>
      <div
        v-if="items?.[id].isEnd"
        class="bg-transparent w-1 h-full cursor-ew-resize"
      >
        <div
          v-on:mousedown.left.self="
            $emit(
              'changeItemEndTime',
              $event,
              Handles.END,
              containerRect,
              items?.[id],
              items?.[id].startPercentage,
              getNextStart(index)
            )
          "
          :id="`${items?.[id].id}-${index}-${id}-end`"
          class="h-full w-full"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated } from 'vue';
import { isToday } from 'date-fns';
import { useUserState } from '../composables/state';
import { DEFAULT_COLOR } from '../constants/colors';
import type {
  FormattedActivities,
  FormattedActivity,
  Container
} from '../types/activity';
import { Handles } from '../types/activity';

const { user } = useUserState();

const props = defineProps<{
  date: Date;
  ids?: FormattedActivities[keyof FormattedActivities]['ids'];
  items?: FormattedActivities[keyof FormattedActivities]['items'];
}>();
defineEmits<{
  (e: 'itemClick', v: MouseEvent, target?: FormattedActivity): void;
  (
    e: 'changeItemStartTime',
    v: MouseEvent,
    handle: Handles,
    container: Container,
    target: FormattedActivity,
    min: number,
    max: number
  ): void;
  (
    e: 'changeItemEndTime',
    v: MouseEvent,
    handle: Handles,
    container: Container,
    target: FormattedActivity,
    min: number,
    max: number
  ): void;
}>();

const container = ref<null | HTMLElement>(null);
const containerRect = ref({
  left: 0,
  right: 0,
  width: 0
});

const getPrevEnd = (index: number) => {
  const targetId = props.ids?.[index - 1];
  if (typeof targetId !== 'string') return 0;
  return props.items?.[targetId].endPercentage ?? 0;
};

const getNextStart = (index: number) => {
  const targetId = props.ids?.[index + 1];
  if (typeof targetId !== 'string') return 99.9999999999;
  return props.items?.[targetId].startPercentage ?? 99.9999999999;
};

onMounted(() => {
  if (container.value) {
    if (isToday(props.date)) {
      container.value.scrollIntoView({ block: 'center' });
    }

    const rect = container.value.getBoundingClientRect();
    const { width, right, left } = rect;
    containerRect.value.width = width;
    containerRect.value.right = right;
    containerRect.value.left = left;
  }
});
onUpdated(() => {
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    const { width, right, left } = rect;
    if (containerRect.value.width !== width) containerRect.value.width = width;
    if (containerRect.value.right !== right) containerRect.value.right = right;
    if (containerRect.value.left !== left) containerRect.value.left = left;
  }
});
</script>
