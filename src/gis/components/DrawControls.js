/*
 * Copyright © 2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import MapboxDraw from '@mapbox/mapbox-gl-draw';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { useEffect, useMemo } from 'react';

import { useMap } from 'terraso-web-client/gis/components/Map';

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
