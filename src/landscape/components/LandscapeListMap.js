import React, { useEffect, useMemo, useRef } from 'react';

import L from 'leaflet';
import _ from 'lodash/fp';

import Map from 'gis/components/Map';

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { useSelector } from 'react-redux';

import { getLandscapePin } from 'landscape/landscapeUtils';

import './LandscapeListMap.css';

import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Link, Typography } from '@mui/material';

import { countryNameForCode } from 'common/utils';

import { isValidLatitude, isValidLongitude } from 'gis/gisUtils';

const LandscapesClusters = () => {
  const map = useMap();
  const { t } = useTranslation();
  const { landscapes } = useSelector(state => state.landscape.list);

  const clusterRef = useRef();

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
    if (!_.isEmpty(landscapesWithPosition)) {
      const bounds = clusterRef.current?.getBounds?.();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds);
      }
    }
  }, [map, landscapesWithPosition]);

  return (
    <MarkerClusterGroup
      ref={clusterRef}
      maxClusterRadius={40}
      showCoverageOnHover={false}
      iconCreateFunction={cluster => {
        return L.divIcon({
          className: 'landscape-list-map-cluster-icon',
          iconSize: new L.Point(40, 40),
          html: `<div>${cluster.getChildCount()}</div>`,
        });
      }}
    >
      {landscapesWithPosition.map((landscape, index) => (
        <Marker
          icon={L.divIcon({
            className: 'landscape-list-map-marker-icon',
            iconSize: new L.Point(15, 15),
            html: `<span class="visually-hidden">${landscape.data.name}</span>`,
          })}
          key={index}
          position={landscape.position}
        >
          <Popup className="landscape-marker-popup" closeButton={false}>
            <Link
              variant="h6"
              component={RouterLink}
              to={`/landscapes/${landscape.data.slug}`}
            >
              {landscape.data.name}
            </Link>
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              {countryNameForCode(landscape.data.location)?.name ||
                landscape.data.location}
            </Typography>
            <Link
              variant="body2"
              component={RouterLink}
              to={`/landscapes/${landscape.data.slug}`}
            >
              {t('landscape.list_map_popup_link', {
                name: landscape.data.name,
              })}
            </Link>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};

const LandscapeListMap = () => {
  return (
    <Map
      style={{
        width: '100%',
        height: '400px',
      }}
    >
      <LandscapesClusters />
    </Map>
  );
};

export default LandscapeListMap;
