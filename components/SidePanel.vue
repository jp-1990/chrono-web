<template>
  <div
    :class="[isOpen ? 'border-l' : 'translate-x-96 border-none']"
    class="fixed z-30 w-96 p-2 top-0 right-0 flex flex-col h-screen overflow-hidden bg-white border-l-slate-200 duration-200"
  >
    <!-- title -->
    <header
      id="side-panel-header"
      class="flex justify-between items-start mb-2"
    >
      <h1 class="text-2xl ml-2 mt-1 font-bold">
        <slot name="title-text">Title</slot>
      </h1>
      <close-icon @click="$emit('onClose', $event)" :size="30" role="button" />
    </header>

    <!-- content -->
    <section id="side-panel-content" class="flex flex-col mx-2">
      <slot name="content"></slot>
    </section>

    <div class="flex flex-1"></div>

    <!-- submit -->
    <button
      id="side-panel-submit"
      @click="$emit('onSubmit', $event)"
      :disabled="disableSubmit"
      type="submit"
      :class="[disableSubmit ? 'bg-slate-400' : 'bg-slate-700']"
      class="h-14 rounded-sm text-lg text-slate-200"
    >
      <slot name="submit-text">Submit</slot>
    </button>
  </div>

  <!-- modal backgrounds -->
  <div
    @click="$emit('onClose', $event)"
    :class="[
      isOpen
        ? 'w-full opacity-20 [transition:opacity_0.2s_cubic-bezier(0.4,0,0.2,1)_0s]'
        : 'w-0 opacity-0 [transition:width,_0s,_linear,_1s,opacity_0.2s_cubic-bezier(0.4,0,0.2,1)_0s]'
    ]"
    class="fixed z-20 h-full bg-black"
  ></div>
</template>

<script setup lang="ts">
import CloseIcon from 'vue-material-design-icons/Close.vue';

defineProps<{
  isOpen: boolean;
  disableSubmit: boolean;
}>();
defineEmits<{
  (e: 'onSubmit', v: MouseEvent): void;
  (e: 'onClose', v: MouseEvent): void;
}>();
</script>
