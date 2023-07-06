import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useEffect } from 'react';
import { useMap } from './MapboxMap';

const DrawControls = props => {
  const { onChange, onCreate, onModeChange, onSelectionChange, drawOptions } =
    props;
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        ...drawOptions,
      },
    });

    map.addControl(draw, 'top-left');

    map.on('draw.create', () => {
      const all = draw.getAll();
      onChange?.(all);
      onCreate?.(all);
    });
    map.on('draw.update', () => {
      const all = draw.getAll();
      onChange?.(all);
    });
    map.on('draw.delete', () => {
      const all = draw.getAll();
      onChange?.(all);
    });
    map.on('draw.modechange', event => {
      onModeChange?.(event, draw);
    });
    map.on('draw.selectionchange', event => {
      onSelectionChange?.(event, draw);
    });
  }, [map, onChange, onCreate, onModeChange, onSelectionChange, drawOptions]);
};

export default DrawControls;
