import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

import 'gis/components/Map.css';

const Map = props => {
  return (
    <MapContainer zoomDelta={0.5} wheelPxPerZoomLevel={100} {...props}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {props.children}
    </MapContainer>
  );
};

export default Map;
