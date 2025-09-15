import { useCallback, useEffect, useMemo, useState } from 'react';

const KEY = {
  LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', UP: 'ArrowUp', DOWN: 'ArrowDown', ENTER: 'Enter'
};

export function useSpotlightNavigation({
  count,
  orientation = 'vertical',
  initialIndex = 0,
  wrap = true,
  onEnter,
  containerRef
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialIndex), Math.max(0, count - 1)));

  useEffect(() => {
    setIndex((i) => Math.min(Math.max(0, i), Math.max(0, count - 1)));
  }, [count]);

  const move = useCallback((dir) => {
    if (!count) return;
    setIndex((i) => {
      let next = i;
      const isH = orientation === 'horizontal';
      if (dir === 'prev' && (!isH ? KEY.UP : KEY.LEFT)) next = i - 1;
      if (dir === 'next' && (!isH ? KEY.DOWN : KEY.RIGHT)) next = i + 1;
      if (wrap) {
        if (next < 0) next = count - 1;
        if (next > count - 1) next = 0;
      } else {
        next = Math.min(Math.max(0, next), count - 1);
      }
      return next;
    });
  }, [count, orientation, wrap]);

  const onKeyDown = useCallback((e) => {
    const isH = orientation === 'horizontal';
    switch (e.key) {
      case KEY.LEFT:
        if (isH) { e.preventDefault(); move('prev'); }
        break;
      case KEY.RIGHT:
        if (isH) { e.preventDefault(); move('next'); }
        break;
      case KEY.UP:
        if (!isH) { e.preventDefault(); move('prev'); }
        break;
      case KEY.DOWN:
        if (!isH) { e.preventDefault(); move('next'); }
        break;
      case KEY.ENTER:
        if (onEnter) onEnter(index);
        break;
      default:
        break;
    }
  }, [index, move, onEnter, orientation]);

  useEffect(() => {
    if (!containerRef?.current) return;
    const el = containerRef.current;
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [containerRef, onKeyDown]);

  const getItemProps = useCallback((i) => ({
    tabIndex: i === index ? 0 : -1,
    'data-focused': i === index ? 'true' : 'false',
    onFocus: () => setIndex(i)
  }), [index]);

  const containerProps = useMemo(() => ({
    tabIndex: 0,
    'data-spotlight-container': true
  }), []);

  return { index, setIndex, getItemProps, containerProps, onKeyDown };
}
