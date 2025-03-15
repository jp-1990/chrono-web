import { format } from 'date-fns';
import { ref } from 'vue';
import type { FormattedActivity, Container } from '~/types/activity';
import { Handles } from '~/types/activity';
import { roundSeconds, timeOfDayToPercentage } from '~/utils/date';
import { Diff, getItemDate } from '~/utils/item';

export const useStartEndDragOld = (breakpoint: number) => {
  const dragTime = ref<string | undefined>(undefined);

  function setDragTime(date: string) {
    dragTime.value = format(new Date(date), 'HH:mm');
  }

  const initialMouseDown = {
    handle: undefined as Handles | undefined,
    startX: 0,
    pressed: false,
    container: undefined as Container | undefined,
    target: undefined as FormattedActivity | undefined,
    min: 0,
    max: 100,
    date: undefined as Date | undefined
  };

  const mouseDownState = ref({ ...initialMouseDown });
  const resetMouseDownState = () => {
    mouseDownState.value = { ...initialMouseDown };
  };

  const onMouseDown = (
    event: MouseEvent,
    handle: Handles,
    container: Container,
    target: FormattedActivity,
    min: number,
    max: number
  ) => {
    if (mouseDownState.value.pressed) return;

    mouseDownState.value.handle = handle;
    mouseDownState.value.startX = event.pageX;
    mouseDownState.value.pressed = true;
    mouseDownState.value.container = container;
    mouseDownState.value.target = target;
    mouseDownState.value.min = min;
    mouseDownState.value.max = max;

    setDragTime(target[handle]);
  };

  const onMouseUp = (event: MouseEvent) => {
    const { handle, startX, target, container, min, max } =
      mouseDownState.value;
    if (!handle || !target || !container) return;

    const diff = new Diff(
      event.pageX,
      startX,
      container,
      handle,
      target,
      min,
      max,
      breakpoint
    );
    diff.applyBreakpoint();
    diff.restrictMinValue();
    diff.restrictMaxValue();

    const newDate = getItemDate({
      difference: diff.value,
      date: new Date(target[handle])
    });

    if (handle === Handles.START) {
      const width = target.width - diff.value;
      const startPercentage = timeOfDayToPercentage(newDate);
      const style = `left: ${startPercentage}%; width: ${width}%;`;

      target.width = width;
      target.style = style;
      target.start = roundSeconds(newDate).toISOString();
      target.startPercentage = timeOfDayToPercentage(newDate);
    }

    if (handle === Handles.END) {
      const width = target.width + diff.value;
      const style = `left: ${target.startPercentage}%; width: ${width}%;`;

      target.width = width;
      target.style = style;
      target.end = newDate.toISOString();
      target.endPercentage = timeOfDayToPercentage(newDate);
    }

    resetMouseDownState();
    return target;
  };

  const onMouseMove = (event: MouseEvent) => {
    const { handle, target, startX, container, min, max } =
      mouseDownState.value;
    if (!handle || !target || !container) return;

    const itemContainerEnd = container?.right || event.pageX;
    const pageX = Math.min(event.pageX, itemContainerEnd);

    const diff = new Diff(
      pageX,
      startX,
      container,
      handle,
      target,
      min,
      max,
      breakpoint
    );
    diff.restrictMaxValue();
    diff.restrictMinValue();

    const newDate = getItemDate({
      difference: diff.value,
      date: new Date(target[handle])
    });

    if (handle === Handles.START) {
      const width = target.width - diff.value;
      const startPercentage = timeOfDayToPercentage(newDate);
      const style = `left: ${startPercentage}%; width: ${width}%;`;
      target.style = style;
    }

    if (handle === Handles.END) {
      const width = target.width + diff.value;
      const style = `left: ${target.startPercentage}%; width: ${width}%;`;
      target.style = style;
    }

    diff.applyBreakpoint();
    setDragTime(
      getItemDate({
        difference: diff.value,
        date: new Date(target[handle])
      }).toISOString()
    );
  };

  return {
    dragTime,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    mouseDownState
  };
};
