import React, { useEffect, useState } from 'react';

import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';

import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'gis/components/Map.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LeafletSearch = ({ onPinLocationChange }) => {
  const map = useMap();
  const [pinLocation, setPinLocation] = useState();
  const [boundingBox, setBoundingBox] = useState();

  useEffect(() => {
    if (pinLocation && boundingBox) {
      onPinLocationChange({
        pinLocation,
        boundingBox,
      });
    }
  }, [boundingBox, pinLocation, onPinLocationChange]);

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      marker: {
        draggable: true,
        mapMarkerIcon: L.Icon.Default,
      },
    });

    map.addControl(searchControl);

    const getPinData = event => {
      const southWest = map.getBounds().getSouthWest();
      const northEast = map.getBounds().getNorthEast();
      const bbox = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
      if (bbox) {
        setBoundingBox(bbox);
      }

      if (event?.location?.lat) {
        setPinLocation({
          lat: event.location.lat,
          lng: event.location.lng,
        });
      }
      if (event?.location?.x) {
        setPinLocation({
          lat: event.location.y,
          lng: event.location.x,
        });
      }
    };

    map.on('geosearch/showlocation', getPinData);
    map.on('geosearch/marker/dragend', getPinData);
    map.on('zoomend', getPinData);

    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
};

const MapPolygon = props => {
  const { bounds, geojson } = props;
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);

  // Added unique key on every rerender to force GeoJSON update
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

      {props.enableSearch && (
        <LeafletSearch onPinLocationChange={props.onPinLocationChange} />
      )}

      {props.children}
    </MapContainer>
  );
};

export default Map;
