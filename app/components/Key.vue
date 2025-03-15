<template>
  <div class="hidden sm:flex">
    <ul class="flex flex-wrap">
      <li v-for="(value, key) in keys" class="flex items-center mr-5 last:mr-2">
        <div
          :style="`background-color: ${value[1]}`"
          class="w-7 h-7 m-1 rounded-sm"
        ></div>
        <div class="ml-1 flex flex-col text-xs leading-3 text-slate-600">
          <p class="ml-px">
            {{ key }}
          </p>
          <div
            class="flex font-mono tracking-tight font-light text-xs text-slate-400"
          >
            [<span class="mr-0.5"
              >{{ millisecondsToHoursAndMinutes(value[0]).hours }}h</span
            >{{ millisecondsToHoursAndMinutes(value[0]).minutes }}m]
          </div>
        </div>
      </li>
    </ul>
  </div>

  <div
    ref="keyButtonEl"
    @click="toggleModal"
    class="sm:hidden flex items-center justify-center w-11 h-9 p-1.5 relative cursor-pointer rounded-[4px] bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200"
  >
    <key-icon :size="24" />

    <div
      class="absolute flex justify-center items-center top-[-6px] right-[-6px] w-[18px] h-[18px] font-mono text-slate-600 text-[11px] bg-slate-100 border border-slate-600 rounded-sm"
    >
      <span>{{ Object.keys(keys).length }}</span>
    </div>
  </div>

  <div ref="keyEl" class="relative">
    <div
      v-if="modalOpen"
      class="absolute top-0.5 z-20 flex flex-col bg-transparent w-[268px]"
    >
      <div
        class="flex justify-center items-center h-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-[4px] text-slate-200"
      >
        <div class="flex items-center justify-between w-full p-2">
          <div
            class="flex flex-col justify-center h-full mb-px leading-3 text-xs overflow-hidden"
          >
            <p
              class="flex font-mono tracking-tight text-[11px]/[11px] font-light text-slate-200 text-ellipsis"
            >
              Recorded activities
            </p>
          </div>
        </div>
      </div>

      <ul
        class="flex flex-wrap content-start p-0.5 bg-white rounded-b-[4px] drop-shadow-lg pb-1"
      >
        <li
          v-for="(value, key) in keys"
          class="flex items-center w-32 h-7 m-0.5 overflow-hidden"
        >
          <div
            :style="`background-color: ${value[1]}`"
            class="w-7 h-7 min-w-7 rounded-sm"
          ></div>
          <div
            class="ml-1 flex flex-col justify-center h-full mb-px leading-3 text-xs overflow-hidden"
          >
            <p class="ml-px text-slate-600 overflow-hidden text-ellipsis">
              {{ key }}
            </p>
            <div
              class="flex font-mono tracking-tight text-[11px]/[11px] font-light text-slate-400 text-ellipsis"
            >
              [<span class="mr-0.5"
                >{{ millisecondsToHoursAndMinutes(value[0]).hours }}h</span
              >{{ millisecondsToHoursAndMinutes(value[0]).minutes }}m]
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import KeyIcon from 'vue-material-design-icons/ChartLineVariant.vue';
import { useWindowEventListener } from '../composables/useEventListener';
import { millisecondsToHoursAndMinutes } from '../utils/date';

// todo:: order keys by duration
defineProps<{
  keys: Record<string, [number, string]>;
}>();

const modalOpen = ref(false);
function toggleModal() {
  modalOpen.value = !modalOpen.value;
}

const keyEl = ref(null);
const keyButtonEl = ref(null);

function closeKeyListener(event: KeyboardEvent | MouseEvent) {
  if (
    !(keyEl.value as any)?.contains(event.target) &&
    !(keyButtonEl.value as any)?.contains(event.target)
  ) {
    if (modalOpen.value) modalOpen.value = false;
  }
}

useWindowEventListener('click', closeKeyListener);
</script>
