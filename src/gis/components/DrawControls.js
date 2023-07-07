import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useEffect, useMemo } from 'react';
import { useMap } from './MapboxMap';

const DrawControls = props => {
  const {
    onChange,
    onCreate,
    onModeChange,
    onSelectionChange,
    drawOptions,
    geoJson,
  } = props;
  const { map } = useMap();

  const draw = useMemo(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          ...drawOptions,
        },
      }),
    [drawOptions]
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    map.addControl(draw, 'top-left');

    map.on('draw.create', event => {
      const all = draw.getAll();
      onChange?.(all);
      onCreate?.(event, draw);
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
  }, [
    map,
    draw,
    onChange,
    onCreate,
    onModeChange,
    onSelectionChange,
    drawOptions,
  ]);

  useEffect(() => {
    if (!map || !geoJson) {
      return;
    }

    draw.set(geoJson);
  }, [map, draw, geoJson]);
};

export default DrawControls;
