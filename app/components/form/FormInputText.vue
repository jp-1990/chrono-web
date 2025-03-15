<template>
  <div class="flex items-center">
    <slot name="start-icon" />
    <label
      :for="`${
        props.id
          ? props.id
          : `${props.label.toLowerCase().replace(' ', '-')}-input`
      }`"
      class="text-xs mt-2 mb-1"
      >{{ props.label }}{{ props.required ? '*' : '' }}</label
    >
  </div>
  <input
    ref="inputRef"
    @blur="onBlur"
    :id="`${
      props.id
        ? props.id
        : `${props.label.toLowerCase().replace(' ', '-')}-input`
    }`"
    :placeholder="props.placeholder"
    :name="props.label"
    v-model="value"
    :type="props.type || 'text'"
    class="border h-10 sm:h-9 bg-white py-1 px-2 rounded-[3px] focus:outline-none focus:border-slate-500 text-sm/[24px] text-slate-700 placeholder:text-slate-400/70 placeholder:font-light"
    :class="[valid === false ? 'border-red-600' : '']"
  />
</template>

<script setup lang="ts">
import { ref, type InputTypeHTMLAttribute } from 'vue';
import { required } from '~/utils/form/validation';
const value = defineModel<string>('value');

const { valid = true, ...props } = defineProps<{
  label: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  type?: InputTypeHTMLAttribute;
  valid?: boolean;
  validators?: ((v: string | undefined) => boolean)[];
}>();

const emit = defineEmits<{
  (e: 'update:valid', v: boolean): void;
  (e: 'onBlur'): void;
}>();

const inputRef = ref<HTMLElement | null>(null);

function onBlur() {
  emit('onBlur');

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
  if (inputRef.value) inputRef.value.focus();
}

defineExpose({ focus });
</script>
