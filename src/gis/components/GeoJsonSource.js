/*
 * Copyright © 2023 Technology Matters
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

import { useCallback, useEffect, useMemo } from 'react';

import { useMap } from 'terraso-web-client/gis/components/Map';

const GeoJsonSource = props => {
  const { id, geoJson, geoJsonUrl, onError } = props;
  const { map, addSource, removeSource } = useMap();

  const handleSourceError = useCallback(
    event => {
      if (onError && event.sourceId === id && event.error) {
        onError(event.error);
      }
    },
    [onError, id]
  );

  // Generation of the current source registration: the removal below is
  // deferred one microtask (sibling <Layer> cleanups run after ours and must
  // detach this source's layers first — mapbox refuses to remove an
  // in-use source) and is skipped if the source was re-registered meanwhile
  // (React StrictMode remount, dependency change). A mutable box on purpose:
  // the cleanup must read the CURRENT generation, not a captured snapshot.
  const generationState = useMemo(() => ({ current: 0 }), []);

  useEffect(() => {
    if (!map) {
      return;
    }
    const generation = ++generationState.current;

    const sourceData = geoJsonUrl
      ? geoJsonUrl
      : geoJson
        ? geoJson
        : { type: 'FeatureCollection', features: [] };

    addSource(id, {
      type: 'geojson',
      data: sourceData,
    });

    // Symmetric cleanup (like Layer.js): remove the source once nothing uses
    // it anymore, so a later style switch (which resurrects every source
    // tracked by the map provider) cannot bring a stale source back to life.
    return () => {
      Promise.resolve().then(() => {
        // The live generation read is the point: a re-registration must
        // cancel this removal (not a captured snapshot).
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (generationState.current !== generation) {
          return;
        }
        try {
          if (map.getSource(id)) {
            removeSource(id);
          }
        } catch {
          // The map was torn down together with the tree — nothing to clean.
        }
      });
    };
  }, [id, map, addSource, removeSource, generationState, geoJson, geoJsonUrl]);

  // Listen for source errors
  useEffect(() => {
    if (!map || !onError) {
      return;
    }

    map.on('error', handleSourceError);
    return () => {
      map.off('error', handleSourceError);
    };
  }, [map, onError, handleSourceError]);

  return null;
};

export default GeoJsonSource;
