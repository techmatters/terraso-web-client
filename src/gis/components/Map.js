import React, { useCallback, useContext, useEffect, useState } from 'react';

import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { MapContainer, ZoomControl, useMap } from 'react-leaflet';

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

function boundsToGeoJsonBbox(bounds) {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
}

const LeafletDraw = () => {
  const { t } = useTranslation();
  const map = useMap();
  const isSmall = useMediaQuery(theme.breakpoints.down('xs'));

  const { onLayersUpdate, drawOptions, featureGroup } = useContext(MapContext);

  L.drawLocal = t('gis.map_draw', { returnObjects: true });

  const updateLayers = useCallback(
    (newFeatureGroup, updateBbox = true) => {
      onLayersUpdate({
        layers: newFeatureGroup.getLayers(),
        ...(updateBbox
          ? { bbox: boundsToGeoJsonBbox(newFeatureGroup.getBounds()) }
          : {}),
      });
    },
    [onLayersUpdate]
  );

  useEffect(() => {
    if (!featureGroup) {
      return;
    }
    const options = {
      position: isSmall ? 'topright' : 'topleft',
      ...(drawOptions?.polygon
        ? {
            edit: {
              featureGroup,
              poly: {
                allowIntersection: false,
                icon: new L.DivIcon({
                  iconSize: new L.Point(14, 14),
                  className: 'leaflet-editing-icon',
                }),
              },
            },
          }
        : {}),
      draw: {
        marker: !!drawOptions?.marker,
        polygon: drawOptions?.polygon
          ? {
              allowIntersection: false,
              showArea: true,
              icon: new L.DivIcon({
                iconSize: new L.Point(14, 14),
              }),
            }
          : false,
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
      },
    };
    const drawControl = new L.Control.Draw(options);
    map.addControl(drawControl);

    const onDrawCreated = event => {
      const { layerType } = event;
      if (layerType === 'marker') {
        updateLayers(L.featureGroup([event.layer]), false);
      }
      if (layerType === 'polygon') {
        const newLayers = L.featureGroup([
          ...featureGroup.getLayers(),
          event.layer,
        ]);
        updateLayers(newLayers);
      }
      drawOptions?.onLayerChange?.();
    };
    const onDrawDeleted = () => updateLayers(featureGroup);
    const onEditStart = () => drawOptions?.onEditStart?.();
    const onEditStop = () => drawOptions?.onEditStop?.();
    const onEdited = () => {
      updateLayers(featureGroup);
      drawOptions?.onLayerChange?.();
    };
    map.on(L.Draw.Event.CREATED, onDrawCreated);
    map.on(L.Draw.Event.DELETED, onDrawDeleted);
    map.on(L.Draw.Event.EDITSTART, onEditStart);
    map.on(L.Draw.Event.EDITSTOP, onEditStop);
    map.on(L.Draw.Event.EDITED, onEdited);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      map.off(L.Draw.Event.DELETED, onDrawDeleted);
      map.off(L.Draw.Event.EDITSTART, onEditStart);
      map.off(L.Draw.Event.EDITSTOP, onEditStop);
      map.off(L.Draw.Event.EDITED, onEdited);
    };
  }, [map, isSmall, drawOptions, featureGroup, updateLayers]);
  return null;
};

const LeafletSearch = () => {
  const map = useMap();
  const { onLayersUpdate } = useContext(MapContext);
  const { t } = useTranslation();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      autoClose: true,
      searchLabel: t('gis.map_search_placeholder'),
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
        onLayersUpdate({
          layers: [L.marker([event.location.lat, event.location.lng])],
        });
      }
      if (event?.location?.x) {
        onLayersUpdate({
          layers: [L.marker([event.location.y, event.location.x])],
        });
      }
    };

    map.on('geosearch/showlocation', getPinData);
    return () => map.removeControl(searchControl);
  }, [map, onLayersUpdate, t]);

  return null;
};

const MapGeoJson = () => {
  const [newGeoJson, setNewGeoJson] = useState();
  const { featureGroup, geojson, onGeoJsonChange, geoJsonFilter } =
    useContext(MapContext);

  useEffect(() => {
    if (!featureGroup) {
      return;
    }
    geojsonToLayer(geojson, featureGroup, {
      pointToLayer: (feature, latlng) => {
        const marker = L.marker(latlng, { draggable: true });
        marker.on('dragend', event => {
          setNewGeoJson(layerToGeoJSON(featureGroup.getLayers()));
        });
        return marker;
      },
      ...(geoJsonFilter ? { filter: geoJsonFilter } : {}),
    });
  }, [featureGroup, geojson, onGeoJsonChange, geoJsonFilter]);

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
  const map = useMap();
  const { t } = useTranslation();
  const [featureGroup, setFeatureGroup] = useState();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { bounds, geojson, onGeoJsonChange, geoJsonFilter, drawOptions } =
    props;

  useEffect(() => {
    if (props.center) {
      map.flyTo(props.center, 3);
    }
  }, [props.center, map]);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);

  useEffect(() => {
    // Feature Group
    const featureGroup = L.featureGroup().addTo(map);
    setFeatureGroup(featureGroup);

    // Layers
    const osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        attribution:
          'Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors Tiles &copy; HOT',
      }
    );
    const esri = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    );

    // Default layer
    map.addLayer(osm);

    // Layers control
    const layersControl = L.control
      .layers({
        [t('gis.map_layer_streets')]: osm,
        [t('gis.map_layer_satellite')]: esri,
      })
      .addTo(map);
    return () => {
      map.removeControl(layersControl);
    };
  }, [map, t]);

  const updateBounds = useCallback(
    bbox => {
      if (!onGeoJsonChange) {
        return;
      }
      onGeoJsonChange(current => {
        if (!current) {
          return null;
        }
        if (_.isEqual(current.bbox, bbox)) {
          return current;
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
    const update = () => {
      const bbox = boundsToGeoJsonBbox(map.getBounds());
      updateBounds(bbox);
    };
    map.on('moveend', update);

    return () => map.off('moveend', update);
  }, [map, updateBounds]);

  const getDefaultBbox = useCallback(() => {
    return boundsToGeoJsonBbox(map.getBounds());
  }, [map]);

  const onLayersUpdate = useCallback(
    ({ layers, bbox = getDefaultBbox() }) => {
      if (_.isEmpty(layers)) {
        return;
      }

      const newGeojson = layerToGeoJSON(layers);
      onGeoJsonChange({
        ...newGeojson,
        bbox,
      });
    },
    [getDefaultBbox, onGeoJsonChange]
  );

  return (
    <MapContext.Provider
      value={{
        featureGroup,
        geoJsonFilter,
        bounds,
        geojson,
        drawOptions,
        onLayersUpdate,
      }}
    >
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
    </MapContext.Provider>
  );
};

const MapWrapper = props => {
  return (
    <MapContainer
      zoomDelta={0.5}
      zoomSnap={0.5}
      wheelPxPerZoomLevel={200}
      zoom={3}
      center={[0, 0]}
      {..._.omit(['center', 'zoom', 'children'], props)}
    >
      <Map {...props} />
    </MapContainer>
  );
};

export default MapWrapper;
