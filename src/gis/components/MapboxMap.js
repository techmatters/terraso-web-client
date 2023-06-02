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
import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import mapboxgl from 'gis/mapbox';
import { MAPBOX_PROJECTION_DEFAULT, MAPBOX_STYLE_DEFAULT } from 'config';
import { withWrapper } from 'react-hoc';

export const MAPBOX_DEM_SOURCE = {
  type: 'raster-dem',
  url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
  tileSize: 512,
  maxzoom: 14,
};

export const MAPBOX_SKY_LAYER = {
  id: 'sky',
  type: 'sky',
  paint: {
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': [0.0, 0.0],
    'sky-atmosphere-sun-intensity': 15,
  },
};

export const MAPBOX_FOG = {
  color: 'rgb(169, 169, 188)', // Lower atmosphere
  'high-color': 'rgb(16, 16, 20)', // Upper atmosphere
  'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
  'space-color': 'rgb(20, 20, 26)', // Background color
  'star-intensity': 0.1, // Background star brightness (default 0.35 at low zoooms )
};

const MapContext = React.createContext();

export const useMap = () => React.useContext(MapContext);

export const MapProvider = props => {
  const { children } = props;
  const [map, setMap] = useState(null);

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
};

const MapboxMap = props => {
  const {
    use3dTerrain,
    style,
    projection,
    initialLocation,
    interactive = true,
    children,
  } = props;
  const { setMap } = useMap();
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: style || MAPBOX_STYLE_DEFAULT,
      interactive,
      projection: projection || MAPBOX_PROJECTION_DEFAULT,
      zoom: 1,
      ...(initialLocation ? initialLocation : {}),
    });

    map.on('load', function () {
      if (use3dTerrain) {
        map.addSource('mapbox-dem', MAPBOX_DEM_SOURCE);
        // add the DEM (Digital Elevation Model) source as a terrain layer with exaggerated height
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer(MAPBOX_SKY_LAYER);
      }

      setMap(map);
    });
    return () => map.remove();
  }, [style, initialLocation, use3dTerrain, projection, interactive, setMap]);

  return (
    <Box
      ref={mapContainer}
      sx={{
        width: '100%',
        height: '400px',
      }}
    >
      {children}
    </Box>
  );
};

export default withWrapper(MapboxMap, MapProvider);
