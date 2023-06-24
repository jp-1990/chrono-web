<template>
  <!-- v-on:drop="
      isReady ? $emit('insertNewItem', $event, date, containerRect) : null
    " -->
  <div
    ref="container"
    id="shift-row"
    class="flex h-14 w-full relative"
    :class="[!isReady ? 'bg-transparent' : 'bg-transparent']"
    @dragenter.prevent
    @dragover.prevent
  >
    <div
      v-if="ids"
      v-for="(id, index) in ids?.value || []"
      :key="id"
      :style="`${items?.value[id].style}`"
      :id="`${items?.value[id].id}-${index}-${id}-container`"
      class="h-full py-0.5 rounded-md flex overflow-hidden absolute"
    >
      <div
        v-if="items?.value[id].isStart"
        :style="`background-color:${items?.value[id].colour}`"
        class="w-1 h-full cursor-ew-resize"
      >
        <div
          v-on:mousedown.left.self="
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
          "
          :id="`${items?.value[id].id}-${index}-${id}-start`"
          :style="`opacity: ${getOpacity(items?.value[id].luminance)}`"
          class="bg-slate-800 h-full w-full"
        ></div>
      </div>
      <div
        :id="`${items?.value[id].id}-${index}-${id}-duration`"
        :style="`background-color:${items?.value[id].colour}`"
        class="flex-1 h-full overflow-hidden"
        :class="[!isReady ? 'bg-slate-100' : 'bg-slate-100']"
      ></div>
      <div
        v-if="items?.value[id].isEnd"
        :style="`background-color:${items?.value[id].colour}`"
        class="w-1 h-full cursor-ew-resize"
      >
        <div
          v-on:mousedown.left.self="
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
          "
          :id="`${items?.value[id].id}-${index}-${id}-end`"
          :style="`opacity: ${getOpacity(items.value[id].luminance)}`"
          class="bg-slate-800 h-full w-full"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref } from 'vue';
import { Container, Handles, FormattedItem } from '~/types/item';

const props = defineProps<{
  date: Date;
  ids?: Ref<string[]>;
  items?: Ref<{ [key: number]: FormattedItem }>;
}>();
defineEmits<{
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
  // (e: 'insertNewItem', v: DragEvent, date: Date, container: Container): void;
}>();

const container = ref<null | HTMLElement>(null);
const containerRect = ref({
  left: 0,
  right: 0,
  width: 0
});

const getPrevEnd = (index: number) => {
  const targetId = props.ids?.value[index - 1];
  if (typeof targetId !== 'number') return 0;
  return props.items?.value[targetId].endPercentage ?? 0;
};

const getNextStart = (index: number) => {
  const targetId = props.ids?.value[index + 1];
  if (typeof targetId !== 'number') return 99.9999999999;
  return props.items?.value[targetId].startPercentage ?? 99.9999999999;
};

const isReady = ref(false);
const setReady = () => setTimeout(() => (isReady.value = true), 500);

const getOpacity = (luminance: number) => {
  if (luminance > 0.6) return 0.03;
  if (luminance > 0.4) return 0.04;
  if (luminance > 0.3) return 0.2;
  if (luminance > 0.2) return 0.2;
  if (luminance > 0.1) return 0.4;
  return 0.5;
};

onMounted(setReady);
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
