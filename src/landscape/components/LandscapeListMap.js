/*
 * Copyright © 2021-2023 Technology Matters
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

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';

import mapboxgl from 'gis/mapbox';
import { getLandscapePin } from 'landscape/landscapeUtils';

import './LandscapeListMap.css';

import { useTranslation } from 'react-i18next';
import { isValidLatitude, isValidLongitude } from 'terraso-client-shared/utils';
import { Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import { countryNameForCode } from 'common/countries';
import Map, { useMap as useMapboxContext } from 'gis/components/Map';
import MapControls from 'gis/components/MapControls';
import MapStyleSwitcher from 'gis/components/MapStyleSwitcher';

import { MAPBOX_LANDSCAPE_DIRECTORY_STYLE } from 'config';

const LandscapePopup = ({ landscape }) => {
  const { t } = useTranslation();

  return (
    <>
      <RouterLink variant="h6" to={`/landscapes/${landscape.data.slug}`}>
        {landscape.data.name}
      </RouterLink>
      <Typography variant="caption" display="block" sx={{ mb: 1 }}>
        {countryNameForCode(landscape.data.location)?.name ||
          landscape.data.location}
      </Typography>
      <RouterLink variant="body2" to={`/landscapes/${landscape.data.slug}`}>
        {t('landscape.list_map_popup_link', {
          name: landscape.data.name,
        })}
      </RouterLink>
    </>
  );
};

const Clusters = props => {
  const { PopupComponent = LandscapePopup } = props;
  const { map, addSource, addLayer } = useMapboxContext();
  const { landscapes } = useSelector(state => state.landscape.list);
  const [popup, setPopup] = useState(null);

  const landscapesWithPosition = useMemo(() => {
    return landscapes
      .map(landscape => ({
        position: getLandscapePin(landscape),
        data: landscape,
      }))
      .filter(landscape => !!landscape.position)
      .filter(landscape => {
        const validLat = isValidLatitude(landscape.position[0]);
        const validLng = isValidLongitude(landscape.position[1]);
        return validLat && validLng;
      });
  }, [landscapes]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const source = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: landscapesWithPosition.map(landscape => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: landscape.position.reverse(),
          },
          properties: {
            ...landscape.data,
          },
        })),
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    };

    const layerClusters = {
      id: 'clusters',
      type: 'circle',
      source: 'landscapes',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#ff580d',
        'circle-radius': 15,
        'circle-stroke-width': 5,
        'circle-stroke-color': '#ff580d',
        'circle-stroke-opacity': 0.5,
      },
    };

    const layerClustersCounts = {
      id: 'cluster-count',
      type: 'symbol',
      source: 'landscapes',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
      },
    };

    const layerUnclusteredPoint = {
      id: 'unclustered-point',
      type: 'circle',
      source: 'landscapes',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#ff580d',
        'circle-radius': 7.5,
        'circle-stroke-width': 0,
      },
    };

    const onClusterClick = e => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      const clusterId = features[0].properties.cluster_id;
      map
        .getSource('landscapes')
        .getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) {
            return;
          }

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
    };

    const onUnclusteredPointClick = e => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const data = e.features[0].properties;

      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const container = document.createElement('div');
      setPopup({
        container,
        coordinates,
        data,
      });
    };
    const pointer = () => (map.getCanvas().style.cursor = 'pointer');
    const noPointer = () => (map.getCanvas().style.cursor = '');

    addSource('landscapes', source);
    addLayer(layerClusters);
    addLayer(layerClustersCounts);
    addLayer(layerUnclusteredPoint);

    // inspect a cluster on click
    map.on('click', 'clusters', onClusterClick);

    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.on('click', 'unclustered-point', onUnclusteredPointClick);

    map.on('mouseenter', 'clusters', pointer);
    map.on('mouseleave', 'clusters', noPointer);
    map.on('mouseenter', 'unclustered-point', pointer);
    map.on('mouseleave', 'unclustered-point', noPointer);

    // Fit bounds of landscapes source
    const bounds = landscapesWithPosition.reduce(
      (bounds, landscape) => bounds.extend(landscape.position),
      new mapboxgl.LngLatBounds()
    );

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
      });
    }

    return () => {
      map.off('click', 'clusters', onClusterClick);
      map.off('click', 'unclustered-point', onUnclusteredPointClick);
      map.off('mouseenter', 'clusters', pointer);
      map.off('mouseleave', 'clusters', noPointer);
      map.off('mouseenter', 'unclustered-point', pointer);
      map.off('mouseleave', 'unclustered-point', noPointer);
    };
  }, [map, addSource, addLayer, landscapesWithPosition, PopupComponent]);

  useEffect(() => {
    if (!map || !popup?.container) {
      return;
    }

    const popupElement = new mapboxgl.Popup({
      className: 'landscape-marker-popup',
    })
      .setLngLat(popup.coordinates)
      .setMaxWidth('none')
      .setDOMContent(popup.container);
    popupElement.addTo(map);

    return () => {
      popupElement.remove();
    };
  }, [popup, map]);

  if (!popup?.container) {
    return null;
  }

  return createPortal(
    <PopupComponent landscape={{ data: popup.data }} />,
    popup.container
  );
};

const LandscapeListMap = props => {
  return (
    <Map projection="mercator" mapStyle={MAPBOX_LANDSCAPE_DIRECTORY_STYLE}>
      <MapControls />
      <MapStyleSwitcher />
      <Clusters {...props} />
    </Map>
  );
};

export default LandscapeListMap;
