<template>
  <div
    @keyup.escape="isOpen && $emit('onClose', $event)"
    tabindex="0"
    :class="[isOpen ? 'border-l' : 'translate-x-96 border-none']"
    class="fixed z-40 w-96 p-2 top-0 right-0 flex flex-col h-screen overflow-hidden bg-white border-l-slate-200 duration-200 overflow-y-auto"
  >
    <!-- title -->
    <header
      id="side-panel-header"
      class="flex justify-between items-start mb-2"
    >
      <h1 class="text-2xl ml-2 mt-1 font-bold text-slate-900">
        <slot name="title-text">Title</slot>
      </h1>
      <close-icon
        class="text-slate-700"
        @click="$emit('onClose', $event)"
        :size="30"
        role="button"
      />
    </header>

    <slot name="description-text"></slot>

    <!-- content -->
    <section id="side-panel-content" class="flex flex-col mx-2">
      <slot name="content"></slot>
    </section>

    <div class="flex flex-1"></div>

    <!-- submit -->
    <div class="w-full flex">
      <button
        id="side-panel-submit"
        @click="$emit('onSubmit', $event)"
        :disabled="disableSubmit"
        type="submit"
        :class="[disableSubmit ? 'bg-slate-400' : 'bg-primary-blue']"
        class="flex-1 h-14 rounded-sm text-lg text-slate-50 focus:outline-slate-700"
      >
        <slot name="submit-text">Submit</slot>
      </button>
      <slot name="extra-button"></slot>
    </div>
  </div>

  <!-- modal backgrounds -->
  <div
    @click="$emit('onClose', $event)"
    :class="[
      isOpen
        ? 'w-full opacity-20 [transition:opacity_0.2s_cubic-bezier(0.4,0,0.2,1)_0s]'
        : 'w-0 opacity-0 [transition:width,_0s,_linear,_1s,opacity_0.2s_cubic-bezier(0.4,0,0.2,1)_0s]'
    ]"
    class="fixed z-30 h-full bg-black"
  ></div>
</template>

<script setup lang="ts">
import CloseIcon from 'vue-material-design-icons/Close.vue';

defineProps<{
  isOpen: boolean;
  disableSubmit?: boolean;
}>();
defineEmits<{
  (e: 'onSubmit', v: MouseEvent): void;
  (e: 'onClose', v: MouseEvent | KeyboardEvent): void;
}>();
</script>
