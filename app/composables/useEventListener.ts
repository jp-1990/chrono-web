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

export const useElementEventListener = (
  target: Element | null | undefined,
  type: string,
  listener: (e: any) => void,
  options?: boolean | AddEventListenerOptions | undefined
) => {
  onMounted(() => {
    target?.addEventListener(type, listener, options);
  });

  onUnmounted(() => {
    target?.removeEventListener(type, listener);
  });
};
