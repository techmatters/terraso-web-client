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
import React, { useEffect, useMemo, useRef } from 'react';

import L from 'leaflet';
import _ from 'lodash/fp';

import Map from 'gis/components/Map';

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import { Marker, Popup, useMap } from 'react-leaflet';
import { useSelector } from 'react-redux';

import { getLandscapePin } from 'landscape/landscapeUtils';

import './LandscapeListMap.css';

import { useTranslation } from 'react-i18next';

import { Link, Typography } from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import { countryNameForCode } from 'common/utils';

import { LAYER_ESRI } from 'gis/components/Map';
import { isValidLatitude, isValidLongitude } from 'gis/gisUtils';

const LandscapePopup = ({ landscape }) => {
  const { t } = useTranslation();

  return (
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
  );
};

const LandscapesClusters = props => {
  const map = useMap();
  const { landscapes } = useSelector(state => state.landscape.list);
  const { PopupComponent = LandscapePopup } = props;

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
          <PopupComponent landscape={landscape} />
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};

const LandscapeListMap = props => {
  return (
    <Map
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultLayer={LAYER_ESRI}
    >
      <LandscapesClusters {...props} />
    </Map>
  );
};

export default LandscapeListMap;
