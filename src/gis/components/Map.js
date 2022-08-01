import React, { useCallback, useContext, useEffect, useState } from 'react';

import * as turf from '@turf/helpers';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';

import useMediaQuery from '@mui/material/useMediaQuery';

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'gis/components/Map.css';

import theme from 'theme';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapContext = React.createContext();

function geojsonToLayer(geojson, layer, options = {}) {
  layer.clearLayers();
  L.geoJson(geojson, options).eachLayer(l => l.addTo(layer));
}

function layerToGeoJSON(layers) {
  const features = layers
    .filter(layer => layer.toGeoJSON)
    .map(layer => layer.toGeoJSON());
  return {
    type: 'FeatureCollection',
    features,
  };
}

const LeafletDraw = () => {
  const map = useMap();
  const isSmall = useMediaQuery(theme.breakpoints.down('xs'));

  const { onGeoJsonChange } = useContext(MapContext);

  useEffect(() => {
    const options = {
      position: isSmall ? 'topright' : 'topleft',
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
        onGeoJsonChange(layerToGeoJSON([event.layer]));
      }
    });

    return () => map.removeControl(drawControl);
  }, [map, isSmall, onGeoJsonChange]);
  return null;
};

const LeafletSearch = props => {
  const map = useMap();
  const { onGeoJsonChange } = useContext(MapContext);
  const { t } = useTranslation();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      autoClose: true,
      searchLabel: t('common.map_search_placeholder'),
    });
    const currentOnAdd = searchControl.onAdd;
    searchControl.onAdd = param => {
      const container = currentOnAdd.bind(searchControl)(param);

      // Move search box to the first position to improve keyboard navigation
      const parent = searchControl.container.parentElement;
      parent.prepend(searchControl.container);

      return container;
    };

    map.addControl(searchControl);
    map.removeControl(map.zoomControl);

    const getPinData = event => {
      if (event?.location?.lat) {
        onGeoJsonChange({
          type: 'FeatureCollection',
          features: [turf.point([event.location.lng, event.location.lat])],
        });
      }
      if (event?.location?.x) {
        onGeoJsonChange({
          type: 'FeatureCollection',
          features: [turf.point([event.location.x, event.location.y])],
        });
      }
    };

    map.on('geosearch/showlocation', getPinData);
    return () => map.removeControl(searchControl);
  }, [map, onGeoJsonChange, t]);

  return null;
};

const MapGeoJson = () => {
  const [newGeoJson, setNewGeoJson] = useState();
  const { featureGroup, geojson, onGeoJsonChange } = useContext(MapContext);

  useEffect(() => {
    if (!featureGroup) {
      return;
    }

    geojsonToLayer(geojson, featureGroup, {
      style: { color: theme.palette.map.polygon },
      pointToLayer: (feature, latlng) => {
        const marker = L.marker(latlng, { draggable: true });
        marker.on('dragend', event => {
          setNewGeoJson(layerToGeoJSON(featureGroup.getLayers()));
        });
        return marker;
      },
    });
  }, [featureGroup, geojson, onGeoJsonChange]);

  useEffect(() => {
    if (!newGeoJson) {
      return;
    }

    onGeoJsonChange(newGeoJson);
  }, [newGeoJson, onGeoJsonChange]);

  return null;
};

const Location = props => {
  const { enableSearch, enableDraw } = props;

  return (
    <>
      {enableSearch && <LeafletSearch />}
      {enableDraw && <LeafletDraw />}
    </>
  );
};

const Map = props => {
  const [map, setMap] = useState();
  const [featureGroup, setFeatureGroup] = useState();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { bounds, geojson, onGeoJsonChange } = props;

  useEffect(() => {
    if (map?.target && props.center) {
      map.target.flyTo(props.center, 3);
    }
  }, [props.center, map]);

  useEffect(() => {
    if (bounds) {
      map?.target.fitBounds(bounds);
    }
  }, [map?.target, bounds]);

  useEffect(() => {
    if (map?.target) {
      const featureGroup = L.featureGroup().addTo(map?.target);
      setFeatureGroup(featureGroup);
    }
  }, [map?.target]);

  const updateBounds = useCallback(
    bbox => {
      if (!onGeoJsonChange) {
        return;
      }
      onGeoJsonChange(current => {
        if (!current) {
          return null;
        }
        return {
          ...current,
          bbox,
        };
      });
    },
    [onGeoJsonChange]
  );

  useEffect(() => {
    const getZoomData = () => {
      const southWest = map?.target.getBounds().getSouthWest();
      const northEast = map?.target.getBounds().getNorthEast();
      const bbox = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
      updateBounds(bbox);
    };
    map?.target.on('zoomend', getZoomData);
  }, [map?.target, updateBounds]);

  const onGeoJsonChangeWrapper = useCallback(
    geoJson => {
      const southWest = map?.target.getBounds().getSouthWest();
      const northEast = map?.target.getBounds().getNorthEast();
      const bbox = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
      onGeoJsonChange({
        ...geoJson,
        bbox,
      });
    },
    [onGeoJsonChange, map]
  );

  return (
    <MapContext.Provider
      value={{
        map,
        featureGroup,
        onGeoJsonChange: onGeoJsonChangeWrapper,
        bounds,
        geojson,
      }}
    >
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
        <MapGeoJson />
        <Location
          onPinLocationChange={props.onPinLocationChange}
          enableSearch={props.enableSearch}
          enableDraw={props.enableDraw}
          initialPinLocation={props.initialPinLocation}
        />
        {props.enableSearch && (
          <ZoomControl position={isSmall ? 'bottomleft' : 'topleft'} />
        )}
        {props.children}
      </MapContainer>
    </MapContext.Provider>
  );
};

export default Map;
