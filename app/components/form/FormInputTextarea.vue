<template>
  <label :for="`${props.label}-input`" class="text-xs mt-2 mb-1"
    >{{ props.label }}{{ props.required ? '*' : '' }}</label
  >
  <textarea
    ref="inputRef"
    @blur="onBlur"
    :id="`${props.label}-input`"
    :class="[props.valid === false ? 'border-red-600' : '']"
    class="border bg-white py-1 px-2 rounded-[3px] focus:outline-none focus:border-slate-500 text-sm/[24px] text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
    :placeholder="props.placeholder"
    :name="props.label"
    rows="3"
    v-model="value"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { required } from '~/utils/form/validation';
const value = defineModel<string | undefined>('value');

const props = defineProps<{
  label: string;
  placeholder?: string;
  required?: boolean;
  valid?: boolean;
  validators?: ((v: string | undefined) => boolean)[];
}>();

const emit = defineEmits<{
  (e: 'update:valid', v: boolean): void;
}>();

const inputRef = ref<HTMLElement | null>(null);

function onBlur() {
  const validators = props.validators ?? [];
  if (props.required) validators.unshift(required);

  let isValid = true;
  for (const validator of validators) {
    if (!validator(value.value)) {
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
