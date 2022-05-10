import React, { useEffect, useMemo, useRef, useState } from 'react';

import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import _ from 'lodash/fp';
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'gis/components/Map.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LeafletDraw = props => {
  const map = useMap();
  const { setPinLocation } = props;

  useEffect(() => {
    const options = {
      position: 'topleft',
      draw: {
        polyline: false,
        polygon: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
      },
    };
    const drawControl = new L.Control.Draw(options);
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, event => {
      const { layerType } = event;
      if (layerType === 'marker') {
        const location = event.layer.getLatLng();
        setPinLocation({ lat: location.lat, lng: location.lng });
      }
    });

    return () => map.removeControl(drawControl);
  }, [map, setPinLocation]);
  return null;
};

const LeafletSearch = props => {
  const map = useMap();
  const { setBoundingBox, setPinLocation } = props;

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
    });

    map.addControl(searchControl);

    const getPinData = event => {
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
    return () => map.removeControl(searchControl);
  }, [map, setBoundingBox, setPinLocation]);

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

const Location = props => {
  const map = useMap();
  const markerRef = useRef(null);
  const [pinLocation, setPinLocation] = useState();
  const [boundingBox, setBoundingBox] = useState();
  const { onPinLocationChange, enableSearch, enableDraw } = props;

  const markerEventHandlers = useMemo(
    () => ({
      dragend: () => {
        const marker = markerRef.current;
        if (marker != null) {
          setPinLocation(marker.getLatLng());
        }
      },
    }),
    []
  );

  useEffect(() => {
    if (pinLocation && boundingBox) {
      onPinLocationChange({
        pinLocation,
        boundingBox,
      });
    }
  }, [boundingBox, pinLocation, onPinLocationChange]);

  useEffect(() => {
    const getZoomData = () => {
      const southWest = map.getBounds().getSouthWest();
      const northEast = map.getBounds().getNorthEast();
      const bbox = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
      if (bbox) {
        setBoundingBox(bbox);
      }
    };
    getZoomData();
    map.on('zoomend', getZoomData);
  }, [map]);
  return (
    <>
      {enableSearch && (
        <LeafletSearch
          setPinLocation={setPinLocation}
          setBoundingBox={setBoundingBox}
        />
      )}

      {enableDraw && (
        <LeafletDraw
          setPinLocation={setPinLocation}
          setBoundingBox={setBoundingBox}
        />
      )}

      {pinLocation && (
        <Marker
          draggable
          ref={markerRef}
          position={pinLocation}
          eventHandlers={markerEventHandlers}
        />
      )}
    </>
  );
};

const Map = props => {
  const [map, setMap] = useState();

  useEffect(() => {
    if (map?.target && props.center) {
      map.target.flyTo(props.center, 3);
    }
  }, [props.center, map]);

  return (
    <MapContainer
      zoomDelta={0.5}
      zoomSnap={0.5}
      wheelPxPerZoomLevel={200}
      whenReady={setMap}
      zoom={3}
      center={[0, 0]}
      {..._.omit(['center', 'zoom'], props)}
    >
      <TileLayer
        attribution='Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors Tiles &copy; HOT'
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />
      <MapPolygon {...props} />
      <Location
        onPinLocationChange={props.onPinLocationChange}
        enableSearch={props.enableSearch}
        enableDraw={props.enableDraw}
      />

      {props.children}
    </MapContainer>
  );
};

export default Map;
