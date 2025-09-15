import { useMemo, useRef } from 'react';
import { useSpotlightNavigation } from '../hooks/useSpotlightNavigation.js';
import './Playlist.css';

export default function Playlist({ items = [], onSelect }) {
  const containerRef = useRef(null);
  const { index, getItemProps, containerProps } = useSpotlightNavigation({
    count: items.length,
    orientation: 'vertical',
    wrap: true,
    containerRef,
    onEnter: (i) => onSelect && onSelect(items[i])
  });

  const rows = useMemo(() => items.map((item, i) => (
    <li key={item.id} {...getItemProps(i)} className={i === index ? 'focused' : ''}>
      <img src={item.poster} alt="poster" loading="lazy" />
      <div className="meta">
        <div className="title">{item.title}</div>
        <div className="type">{item.type}</div>
      </div>
    </li>
  )), [items, index, getItemProps]);

  return (
    <div className="playlist" ref={containerRef} {...containerProps}>
      <ul>
        {rows}
      </ul>
    </div>
  );
}
