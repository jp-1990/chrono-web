<template>
  <div ref="container" id="item-row" class="flex h-full w-full relative">
    <div v-if="ids" v-for="(id, index) in ids?.value || []" v-on:mouseup="$emit('itemClick', $event, items?.value[id])"
      :key="id" :style="`${items?.value[id].style} background-color:${items?.value[id].colour}`"
      :id="`${items?.value[id].id}-${index}-${id}-container`"
      class="h-full py-0.5 rounded-sm flex overflow-hidden absolute animate-fade-in">
      <div v-if="items?.value[id].isStart" class="bg-transparent w-1 h-full cursor-ew-resize">
        <div v-on:mousedown.left.self="
          isReady
            ? $emit(
              'changeItemStartTime',
              $event,
              Handles.START,
              containerRect,
              items?.value[id],
              getPrevEnd(index),
              items?.value[id].endPercentage
            )
            : null
          " :id="`${items?.value[id].id}-${index}-${id}-start`" class="h-full w-full"></div>
      </div>
      <div :id="`${items?.value[id].id}-${index}-${id}-duration`" class="flex-1 bg-transparent h-full overflow-hidden"
        :class="[!isReady ? 'bg-slate-100' : 'bg-slate-100']"></div>
      <div v-if="items?.value[id].isEnd" class="bg-transparent w-1 h-full cursor-ew-resize">
        <div v-on:mousedown.left.self="
          isReady
            ? $emit(
              'changeItemEndTime',
              $event,
              Handles.END,
              containerRect,
              items?.value[id],
              items?.value[id].startPercentage,
              getNextStart(index)
            )
            : null
          " :id="`${items?.value[id].id}-${index}-${id}-end`" class="h-full w-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Ref, ref, onMounted, onUpdated } from 'vue';
import type { Container, Handles, FormattedItem } from '~/types/item';

const props = defineProps<{
  date: Date;
  ids?: Ref<string[]>;
  items?: Ref<{ [key: number]: FormattedItem }>;
}>();
defineEmits<{
  (e: 'itemClick', v: MouseEvent, target?: FormattedItem): void;
  (
    e: 'changeItemStartTime',
    v: MouseEvent,
    handle: Handles,
    container: Container,
    target: FormattedItem,
    min: number,
    max: number
  ): void;
  (
    e: 'changeItemEndTime',
    v: MouseEvent,
    handle: Handles,
    container: Container,
    target: FormattedItem,
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
  const targetId = props.ids?.value[index - 1];
  if (typeof targetId !== 'string') return 0;
  return props.items?.value[targetId].endPercentage ?? 0;
};

const getNextStart = (index: number) => {
  const targetId = props.ids?.value[index + 1];
  if (typeof targetId !== 'string') return 99.9999999999;
  return props.items?.value[targetId].startPercentage ?? 99.9999999999;
};

const isReady = ref(false);
const setReady = () => setTimeout(() => (isReady.value = true), 500);

onMounted(() => {
  setReady();
  if (container.value && isToday(props.date)) {
    container.value.scrollIntoView({ block: 'center' });
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
