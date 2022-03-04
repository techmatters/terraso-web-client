import React, { useEffect } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';

import 'gis/components/Map.css';

const MapPolygon = props => {
  const { bounds, geojson } = props;
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);

  // Added unique on every rerender to force geo json update
  return <GeoJSON key={uuidv4()} data={geojson} />;
};

const Map = props => {
  return (
    <MapContainer
      zoomDelta={0.5}
      zoomSnap={0.5}
      wheelPxPerZoomLevel={200}
      {...props}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapPolygon {...props} />
      {props.children}
    </MapContainer>
  );
};

export default Map;
