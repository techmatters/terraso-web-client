import React, { useEffect, useMemo, useRef } from 'react';

import L from 'leaflet';
import _ from 'lodash/fp';

import Map from 'gis/components/Map';

import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { Marker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { useSelector } from 'react-redux';

import { getLandscapePin } from 'landscape/landscapeUtils';

import './LandscapeListMap.css';

const LandscapesClusters = () => {
  const map = useMap();
  const { landscapes } = useSelector(state => state.landscape.list);

  const clusterRef = useRef();

  const landscapesWithPosition = useMemo(() => {
    return landscapes
      .map(landscape => ({
        position: getLandscapePin(landscape),
        data: landscape,
      }))
      .filter(landscape => !!landscape.position);
  }, [landscapes]);

  useEffect(() => {
    if (!_.isEmpty(landscapesWithPosition)) {
      const bounds = clusterRef.current?.getBounds?.();
      if (bounds) {
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
        />
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
