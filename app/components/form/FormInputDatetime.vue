<template>
  <div class="flex flex-col w-[calc(50%_-_0.5rem)]">
    <label :for="`${props.label}-input`" class="w-full text-xs mt-2 mb-1">{{ props.label }}{{
      props.required ? '*' : ''
      }}</label>
    <input ref="inputRef" @blur="onBlur" :id="`${props.label}-input`" type="datetime-local"
      :class="[props.valid === false ? 'border-red-600' : '']"
      class="w-full border py-1 px-2 rounded-[3px] focus:outline-none focus:border-slate-500 text-sm/[24px] tracking-tighter text-slate-700 placeholder:text-slate-400/70"
      :placeholder="props.placeholder" :name="props.label" v-model="value" />
  </div>
</template>

<script setup lang="ts">
import { required } from '~/utils/form/validation';
const value = defineModel('value');

const props = defineProps<{
  label: string,
  placeholder?: string,
  required?: boolean,
  valid?: boolean,
  validators?: ((v: string) => boolean)[],
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
  inputRef.value.focus()
}

defineExpose({ focus });
</script>
