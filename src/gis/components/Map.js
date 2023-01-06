import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

export const LAYER_OSM = L.tileLayer(
  'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  {
    attribution:
      'Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors Tiles &copy; HOT',
  }
);
export const LAYER_ESRI = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  }
);

export const LAYERS_BY_URL = _.flow(
  _.map(layer => [layer._url, layer]),
  _.fromPairs
)([LAYER_OSM, LAYER_ESRI]);

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

  const [isEditing, setIsEditing] = useState(false);
  const { onLayersUpdate, drawOptions, featureGroup, onBoundsUpdate } =
    useContext(MapContext);
  const { onLayerChange, onEditStart, onEditStop } = drawOptions;

  // Localized strings
  L.drawLocal = _.defaultsDeep(
    L.drawLocal,
    t('gis.map_draw', { returnObjects: true })
  );

  const polygonEnabled = useMemo(
    () => !!drawOptions.polygon,
    [drawOptions.polygon]
  );
  const markerEnabled = useMemo(
    () => !!drawOptions.marker,
    [drawOptions.marker]
  );
  const editEnabled = useMemo(() => polygonEnabled, [polygonEnabled]);

  useEffect(() => {
    if (!featureGroup) {
      return;
    }
    const options = {
      position: isSmall ? 'topright' : 'topleft',
      ...(editEnabled
        ? {
            edit: {
              featureGroup,
              poly: {
                allowIntersection: false,
                icon: new L.DivIcon({
                  iconSize: new L.Point(14, 14),
                  className: 'leaflet-draw-marker-icon',
                }),
              },
            },
          }
        : {}),
      draw: {
        marker: markerEnabled,
        polygon: polygonEnabled
          ? {
              allowIntersection: false,
              showArea: true,
              icon: new L.DivIcon({
                iconSize: new L.Point(14, 14),
                className: 'leaflet-draw-marker-icon',
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

    drawControl._container.querySelector('a').setAttribute('role', 'button');

    return () => map.removeControl(drawControl);
  }, [editEnabled, isSmall, map, featureGroup, markerEnabled, polygonEnabled]);

  useEffect(() => {
    const onDrawCreatedListener = event => {
      const { layerType } = event;
      if (layerType === 'marker') {
        onLayersUpdate(() => ({
          layers: [event.layer],
        }));
      }
      if (layerType === 'polygon') {
        onLayersUpdate(featureGroup => {
          const newLayers = L.featureGroup([
            ...featureGroup.getLayers(),
            event.layer,
          ]);
          return {
            layers: newLayers.getLayers(),
            bbox: boundsToGeoJsonBbox(newLayers.getBounds()),
          };
        });
      }
      onLayerChange?.();
    };
    const onDrawDeletedListener = () => {
      onLayersUpdate(featureGroup => ({
        layers: featureGroup.getLayers(),
        ...(featureGroup.getBounds().isValid()
          ? {
              bbox: boundsToGeoJsonBbox(featureGroup.getBounds()),
            }
          : {}),
      }));
    };
    const onEditStartListener = () => {
      setIsEditing(true);
      onEditStart?.();
    };
    const onEditStopListener = () => {
      setIsEditing(false);
      onEditStop?.();
    };
    const onEditedListener = () => {
      onLayersUpdate(featureGroup => ({
        layers: featureGroup.getLayers(),
        bbox: boundsToGeoJsonBbox(featureGroup.getBounds()),
      }));
      onLayerChange?.();
    };
    const onMoveListener = () => {
      if (isEditing || !map.getBounds().isValid()) {
        return;
      }
      const bbox = boundsToGeoJsonBbox(map.getBounds());
      onBoundsUpdate(bbox);
    };
    map.on('draw:created', onDrawCreatedListener);
    map.on('draw:deleted', onDrawDeletedListener);
    map.on('draw:editstart', onEditStartListener);
    map.on('draw:editstop', onEditStopListener);
    map.on('draw:edited', onEditedListener);
    map.on('moveend', onMoveListener);

    return () => {
      map.off('draw:created', onDrawCreatedListener);
      map.off('draw:deleted', onDrawDeletedListener);
      map.off('draw:editstart', onEditStartListener);
      map.off('draw:editstop', onEditStopListener);
      map.off('draw:edited', onEditedListener);
      map.off('moveend', onMoveListener);
    };
  }, [
    map,
    onEditStart,
    onEditStop,
    onLayerChange,
    onLayersUpdate,
    onBoundsUpdate,
    isEditing,
  ]);
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
      position: 'topright',
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

      const inputField = searchControl.container.querySelector('input');
      inputField.setAttribute('aria-label', t('gis.map_search_placeholder'));
      inputField.setAttribute('role', 'combobox');

      return container;
    };

    map.addControl(searchControl);
    map.removeControl(map.zoomControl);

    const getPinData = event => {
      if (event?.location?.lat) {
        onLayersUpdate(() => ({
          layers: [L.marker([event.location.lat, event.location.lng])],
        }));
      }
      if (event?.location?.x) {
        onLayersUpdate(() => ({
          layers: [L.marker([event.location.y, event.location.x])],
        }));
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
      style: { color: theme.palette.map.polygon },
      pointToLayer: (feature, latlng) => {
        const marker = L.marker(latlng, { draggable: true });
        if (onGeoJsonChange) {
          marker.on('dragend', event => {
            setNewGeoJson(layerToGeoJSON(featureGroup.getLayers()));
          });
        }
        return marker;
      },
      ...(geoJsonFilter ? { filter: geoJsonFilter } : {}),
    });
  }, [featureGroup, geojson, onGeoJsonChange, geoJsonFilter]);

  useEffect(() => {
    if (!newGeoJson || !onGeoJsonChange) {
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
  const {
    bounds,
    onBoundsChange,
    onBaseMapChange,
    geojson,
    onGeoJsonChange,
    geoJsonFilter,
    drawOptions,
    defaultLayer,
  } = props;

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

    // Default layer
    map.addLayer(defaultLayer || LAYER_OSM);

    // Layers control
    const layersControl = L.control
      .layers({
        [t('gis.map_layer_streets')]: LAYER_OSM,
        [t('gis.map_layer_satellite')]: LAYER_ESRI,
      })
      .addTo(map);

    return () => {
      map.removeControl(layersControl);
      featureGroup.remove();
    };
  }, [map, t, defaultLayer]);

  useEffect(() => {
    const onMoveListener = () => onBoundsChange?.(map.getBounds());
    map.on('moveend', onMoveListener);
    return () => {
      map.on('moveend', onMoveListener);
    };
  }, [map, onBoundsChange]);

  useEffect(() => {
    const onBaseMapChangeListener = event => onBaseMapChange?.(event.layer);
    map.on('baselayerchange', onBaseMapChangeListener);
    return () => {
      map.on('baselayerchange', onBaseMapChangeListener);
    };
  }, [map, onBaseMapChange]);

  const onBoundsUpdate = useCallback(
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

  const getDefaultBbox = useCallback(
    () => boundsToGeoJsonBbox(map.getBounds()),
    [map]
  );

  const onLayersUpdate = useCallback(
    getUpdate => {
      if (!featureGroup) {
        return;
      }
      const { layers, bbox = getDefaultBbox() } = getUpdate(featureGroup);
      if (_.isEmpty(layers)) {
        onGeoJsonChange(null);
        return;
      }

      const newGeojson = layerToGeoJSON(layers);
      onGeoJsonChange({
        ...newGeojson,
        bbox,
      });
    },
    [getDefaultBbox, onGeoJsonChange, featureGroup]
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
        onBoundsUpdate,
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
      maxZoom={18}
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
