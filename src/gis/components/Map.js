import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

const Map = props => {
  return (
    <MapContainer scrollWheelZoom={false} {...props}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {props.children}
    </MapContainer>
  );
};

export default Map;
