<template>
  <label for="color" class="text-xs mt-2 mb-1">Color</label>
  <div
    id="color"
    :style="`background-color:${formState.data.color}`"
    @click="onToggleSelectColor"
    @keyup.enter="onToggleSelectColor"
    role="button"
    tabindex="0"
    class="h-8 w-12 m-px mb-1 rounded-sm"
    ref="colorBox"
    name="color"
  ></div>

  <div
    class="flex flex-col overflow-hidden"
    :class="[selectColorOpen ? 'h-auto' : 'h-0']"
    tabindex="-1"
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
        @click="setSelectedColor(color)"
        @keyup.enter="setSelectedColor(color)"
        tabindex="0"
        role="button"
        class="h-8 w-12 m-px rounded-sm focus:outline-slate-900 focus:outline-2"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const selectColorOpen = ref(false);
const onToggleSelectColor = () => {
  selectColorOpen.value = !selectColorOpen.value;
};

watch(selectColorOpen, (open) => {
  if (open) {
    colorRefs[cursor.value[0]][cursor.value[1]].value![0].focus();
  } else {
    colorBox.value!.focus();
  }
});

const setSelectedColor = (color: string) => {
  formState.value.data.color = color;
  selectColorOpen.value = false;
};

const formState = ref({
  data: {
    color: 'rgb(38, 203, 255)'
  }
});
const cursor = ref([0, 0]);
const colorBox = ref<HTMLElement | null>(null);

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
</script>
