<template>
  <div
    ref="modalEl"
    @keydown.tab="handleTab"
    @keyup.escape="isOpen && $emit('onClose', $event)"
    tabindex="0"
    :class="[isOpen ? '' : 'translate-x-full md:translate-x-96']"
    class="fixed z-40 w-screen md:w-96 top-0 right-0 flex flex-col h-screen overflow-hidden bg-slate-50 duration-200 overflow-y-auto"
  >
    <!-- title -->
    <header
      :id="`side-panel-header-${id}`"
      class="relative flex flex-col justify-between items-start mb-2 bg-gradient-to-r from-slate-700 to-slate-800 border-b-2 border-b-slate-300"
    >
      <div
        :class="[!!slots['description-extra'] ? 'h-[72px]' : 'h-[76px]']"
        class="flex flex-col"
      >
        <span class="ml-4 mt-3 flex flex-row items-center">
          <slot name="title-icon">
            <title-icon class="text-slate-50" :size="32" />
          </slot>
          <h1 class="text-3xl ml-1.5 font-bold text-slate-50">
            <slot name="title-text">title-text</slot>
          </h1>
        </span>
        <h6 class="ml-5 text-xs/[14px] text-slate-300/80 font-light">
          <slot name="description-text">descrtiption_text</slot>
        </h6>
      </div>
      <div
        :class="[!!slots['description-extra'] ? 'flex' : 'hidden']"
        class="items-center pl-5 pb-0.5 h-6 w-full bg-slate-800 text-slate-300 text-[10px]/[10px] font-light"
      >
        <slot name="description-extra"> description-extra </slot>
      </div>
      <close-icon
        class="absolute top-0 right-0 text-slate-200 m-2"
        @click="$emit('onClose', $event)"
        :size="24"
        role="button"
      />
    </header>

    <!-- content -->
    <section :id="`side-panel-content-${id}`" class="flex flex-col mx-4">
      <slot name="content">content</slot>
    </section>

    <div class="flex flex-1"></div>

    <!-- submit -->
    <div class="w-full flex my-4">
      <button
        :id="`side-panel-submit-${id}`"
        @click="$emit('onSubmit', $event)"
        :disabled="disableSubmit"
        type="submit"
        :class="[
          disableSubmit
            ? 'bg-slate-400 text-slate-200'
            : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-50 '
        ]"
        class="flex flex-1 justify-center items-center min-w-[calc(50%_-_0.5rem)] h-10 mx-4 rounded-[3px] text-sm focus:outline-slate-400"
      >
        <slot name="submit-text">submit-text</slot>
      </button>
      <slot name="extra-button">
        <button
          :id="`side-panel-extra-${id}`"
          @click="$emit('onExtra', $event)"
          :disabled="disableExtra"
          type="button"
          :class="[
            disableExtra
              ? 'bg-slate-300 border-slate-400/40 text-slate-400'
              : 'bg-white border-slate-700 text-slate-700',
            !!slots['extra-button-text'] ? 'flex' : 'hidden'
          ]"
          class="flex-1 justify-center items-center h-10 mr-4 rounded-[3px] border text-sm focus:outline-slate-700"
        >
          <slot name="extra-button-text">extra-button-text</slot>
        </button>
      </slot>
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
import { useSlots, ref, watch } from 'vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import TitleIcon from 'vue-material-design-icons/Timelapse.vue';

const slots = useSlots();

const props = defineProps<{
  id: string;
  isOpen: boolean;
  disableSubmit?: boolean;
  disableExtra?: boolean;
}>();
const emit = defineEmits<{
  (e: 'onSubmit', v: MouseEvent): void;
  (e: 'onExtra', v: MouseEvent): void;
  (e: 'onClose', v: MouseEvent | KeyboardEvent | undefined): void;
}>();

const router = useRouter();
router.beforeEach((_args) => {
  if (props.isOpen) {
    emit('onClose', undefined);
    return false;
  }
});

const modalEl = ref<HTMLElement | null>(null);
const focusableElements = ref<HTMLInputElement[] | undefined>(undefined);

const handleTab = (event: KeyboardEvent) => {
  const availableElements = focusableElements.value?.filter((e) => {
    return !e.classList.contains('hidden') && !e.disabled;
  });

  if (!props.isOpen) return;
  if (event.shiftKey && document.activeElement === availableElements?.[0]) {
    event.preventDefault();
    availableElements[availableElements.length - 1].focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === availableElements?.[availableElements.length - 1]
  ) {
    event.preventDefault();
    availableElements[0].focus();
  }
};

watch(props, (props) => {
  if (props.isOpen) {
    focusableElements.value = modalEl.value
      ?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      .values()
      .toArray() as any;
  }
});

function onCloseListener(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    e.preventDefault();
    emit('onClose', e);
  }
}

const startX = ref<number | undefined>(undefined);
const startFocusType = ref<string | undefined>(undefined);

function onTouchStartListener(e: TouchEvent) {
  e.preventDefault();

  startX.value = e.changedTouches[0].pageX;
  startFocusType.value = (document.activeElement as any)?.type;
}

function onTouchMoveListener(e: TouchEvent) {
  e.preventDefault();

  const closeThreshold = window.innerWidth / 3;
  const currentX = e.changedTouches[0].pageX;
  if (currentX - closeThreshold > 0) {
    let keyboardInputs = [
      'text',
      'password',
      'number',
      'email',
      'tel',
      'url',
      'search'
    ];
    if (startFocusType.value && keyboardInputs.includes(startFocusType.value)) {
      hideKeyboard();
    }

    emit('onClose', undefined);
  }
}

useWindowEventListener('keydown', onCloseListener);
useElementEventListener(modalEl.value, 'touchstart', onTouchStartListener);
useElementEventListener(modalEl.value, 'touchmove', onTouchMoveListener);
</script>
