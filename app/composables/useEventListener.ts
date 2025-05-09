import { onMounted, onUnmounted } from 'vue';

export const useWindowEventListener = <K extends keyof WindowEventMap>(
  type: K,
  listener: (ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions | undefined
) => {
  onMounted(() => {
    window?.addEventListener(type, listener, options);
  });

  onUnmounted(() => {
    window?.removeEventListener(type, listener);
  });
};
