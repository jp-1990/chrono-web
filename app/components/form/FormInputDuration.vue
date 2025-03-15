<template>
  <div class="flex items-center">
    <label class="w-16 text-xs"
      >{{ props.label }}{{ props.required ? '*' : '' }}</label
    >
    <div
      class="flex justify-center items-center h-[30px] sm:h-[26px] pl-0.5 pr-2 border border-slate-200 rounded-[3px] bg-white"
    >
      <input
        id="hours"
        class="text-right border-transparent w-5 h-6 bg-transparent py-1 pl-1 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
        :value="hh"
        placeholder="- - "
        @input="onHHChange"
        @keypress="preventNonNumericInput"
        @blur="onBlur"
      />
      <div class="ml-px text-slate-300 font-mono text-xs">h</div>
      <input
        id="minutes"
        class="text-right border-transparent w-5 h-6 bg-transparent py-1 pl-1 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
        :value="mm"
        placeholder="- - "
        @input="onMMChange"
        @keypress="preventNonNumericInput"
        @blur="onBlur"
      />
      <div class="ml-px text-slate-300 font-mono text-xs">m</div>
      <input
        id="seconds"
        class="text-right border-transparent w-5 h-6 bg-transparent py-1 pl-1 rounded-[3px] focus:outline-none focus:border-slate-500 text-xs text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
        :value="ss"
        placeholder="- - "
        @input="onSSChange"
        @keypress="preventNonNumericInput"
        @blur="onBlur"
      />
      <div class="ml-px text-slate-300 font-mono text-xs">s</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { preventNonNumericInput } from '~/utils/ui';
import { required } from '~/utils/form/validation';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{
  label: string;
  required?: boolean;
  valid?: boolean;
  validators?: ((v: number | undefined) => boolean)[];
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void;
  (e: 'update:valid', v: boolean): void;
}>();

onMounted(() => {
  const { h, m, s } = toHoursMinutesSeconds(props.modelValue ?? 0);

  hh.value = h;
  mm.value = m;
  ss.value = s;
});

watch(props, (props) => {
  const { h, m, s } = toHoursMinutesSeconds(props.modelValue ?? 0);

  hh.value = h;
  mm.value = m;
  ss.value = s;
});

const hh = ref<string | undefined>(undefined);
const mm = ref<string | undefined>(undefined);
const ss = ref<string | undefined>(undefined);

function leadingZero(n: string | number) {
  if (+n === 0) return `00`;
  if (+n < 10) return `0${+n}`;
  return `${+n}`;
}

function toHoursMinutesSeconds(v: string) {
  const raw = +v;

  const h = leadingZero(Math.floor(raw / 3600));
  const m = leadingZero(Math.floor((raw % 3600) / 60));
  const s = leadingZero(Math.floor((raw % 3600) % 60));

  return { h, m, s };
}

function toSeconds(
  hh: string | undefined,
  mm: string | undefined,
  ss: string | undefined
) {
  const h = hh ? +hh : 0;
  const m = mm ? +mm : 0;
  const s = ss ? +ss : 0;
  return h * 60 * 60 + m * 60 + s;
}

function onHHChange(e) {
  hh.value = leadingZero(e.target.value);
  emit('update:modelValue', toSeconds(e.target.value, mm.value, ss.value));
}

function onMMChange(e) {
  mm.value = leadingZero(e.target.value);
  emit('update:modelValue', toSeconds(hh.value, e.target.value, ss.value));
}

function onSSChange(e) {
  ss.value = leadingZero(e.target.value);
  emit('update:modelValue', toSeconds(hh.value, mm.value, e.target.value));
}

const inputRef = ref<HTMLElement | null>(null);

function onBlur() {
  const validators = props.validators ?? [];
  if (props.required) validators.unshift(required);

  let isValid = true;
  for (const validator of validators) {
    if (!validator(toSeconds(hh.value, mm.value, ss.value))) {
      isValid = false;
      break;
    }
  }

  emit('update:valid', isValid);
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>
