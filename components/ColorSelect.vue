<template>
  <label for="color" class="text-xs mt-2 mb-1">Color</label>
  <div
    id="color"
    :style="`background-color:${selectedColor}`"
    @click="onToggleColorSelect"
    @keyup.enter="onToggleColorSelect"
    role="button"
    tabindex="0"
    class="h-8 w-12 m-px mb-1 rounded-sm focus:outline-none focus:border focus:border-slate-700"
    ref="selectedColorEl"
    name="color"
  ></div>

  <div
    class="flex flex-col"
    :class="[colorSelectOpen ? 'h-auto' : 'h-0 overflow-hidden']"
    @keyup.k="onFocus('up', cursor[0], cursor[1])"
    @keyup.j="onFocus('down', cursor[0], cursor[1])"
    @keyup.h="onFocus('left', cursor[0], cursor[1])"
    @keyup.l="onFocus('right', cursor[0], cursor[1])"
  >
    <div v-for="(colorRow, rowIndex) in colorMatrix" class="flex">
      <div
        v-for="(color, colorIndex) in colorRow"
        :style="`background-color:${color}`"
        :ref="colorRefs[rowIndex][colorIndex]"
        :id="color"
        :tabindex="colorSelectOpen ? 0 : -1"
        @click="setSelectedColor(color)"
        @keyup.enter="setSelectedColor(color)"
        role="button"
        class="h-8 w-12 m-px rounded-sm focus:outline-1 focus:outline-slate-700"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  forceClosed: boolean;
  value?: string;
}>();
const emit = defineEmits<{
  (e: 'onChange', color: string): void;
}>();

const colorSelectOpen = ref(false);
const onToggleColorSelect = () => {
  colorSelectOpen.value = !colorSelectOpen.value;
};

watch(colorSelectOpen, (open) => {
  if (open) {
    colorRefs[cursor.value[0]][cursor.value[1]].value![0].focus();
  } else {
    selectedColorEl.value!.focus();
  }
});

watch(props, ({ value }) => {
  if (value) {
    selectedColor.value = value;
  }
});

const selectedColor = ref<string>('rgb(38, 203, 255)');
const setSelectedColor = (color: string) => {
  selectedColor.value = color;
  colorSelectOpen.value = false;
  emit('onChange', color);
};

const cursor = ref([0, 0]);
const selectedColorEl = ref<HTMLElement | null>(null);

const onFocus = (
  direction: 'up' | 'down' | 'left' | 'right',
  rowIndex: number,
  colorIndex: number
) => {
  let targetColorIndex: number;
  let targetRowIndex: number;
  switch (direction) {
    case 'up':
      targetRowIndex = rowIndex === 0 ? 2 : rowIndex - 1;
      targetColorIndex = colorIndex;
      break;
    case 'down':
      targetRowIndex = rowIndex === 2 ? 0 : rowIndex + 1;
      targetColorIndex = colorIndex;
      break;
    case 'left':
      targetRowIndex = rowIndex;
      targetColorIndex = colorIndex === 0 ? 6 : colorIndex - 1;
      break;
    case 'right':
      targetRowIndex = rowIndex;
      targetColorIndex = colorIndex === 6 ? 0 : colorIndex + 1;
      break;
  }
  cursor.value = [targetRowIndex, targetColorIndex];
  colorRefs[targetRowIndex][targetColorIndex].value![0].focus();
};

const colorMatrix = [
  [
    'rgb(229, 229, 229)',
    'rgb(126, 126, 126)',
    'rgb(50, 50, 50)',
    'rgb(0, 0, 0)',
    'rgb(0, 63, 6)',
    'rgb(0, 118, 19)',
    'rgb(4, 218, 0)'
  ],
  [
    'rgb(255, 214, 0)',
    'rgb(255, 86, 0)',
    'rgb(177, 64, 0)',
    'rgb(86, 26, 0)',
    'rgb(0, 0, 128)',
    'rgb(0, 0, 255)',
    'rgb(38, 203, 255)'
  ],
  [
    'rgb(255, 0, 199)',
    'rgb(192, 0, 150)',
    'rgb(234, 0, 0)',
    'rgb(126, 0, 0)',
    'rgb(75, 0, 111)',
    'rgb(155, 0, 250)',
    'rgb(0, 128, 128)'
  ]
];

const colorRefs = colorMatrix.map((row) => {
  return row.map(() => ref<HTMLElement | null>(null));
});

onUpdated(() => {
  if (props.forceClosed && colorSelectOpen) {
    colorSelectOpen.value = false;
    selectedColor.value = 'rgb(38, 203, 255)';
    cursor.value = [0, 0];
  }
});
</script>
