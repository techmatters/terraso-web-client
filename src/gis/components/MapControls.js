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

import { useEffect } from 'react';

import { useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';

const MapControls = props => {
  const { showCompass, showZoom = true, visualizePitch } = props;
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    const navigationControl = new mapboxgl.NavigationControl({
      showCompass,
      showZoom,
      visualizePitch,
    });
    map.addControl(navigationControl, 'top-left');

    return () => {
      // Shared maps (e.g. the story map editor map) outlive this control's
      // mount: remove it so re-mounting does not stack up controls.
      map.removeControl(navigationControl);
    };
  }, [map, showCompass, showZoom, visualizePitch]);

  return null;
};

export default MapControls;
