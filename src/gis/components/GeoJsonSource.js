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

import { useCallback, useEffect } from 'react';

import { useMap } from 'terraso-web-client/gis/components/Map';

const GeoJsonSource = props => {
  const { id, geoJson, geoJsonUrl, onError } = props;
  const { map, addSource } = useMap();

  const handleSourceError = useCallback(
    event => {
      if (onError && event.sourceId === id && event.error) {
        onError(event.error);
      }
    },
    [onError, id]
  );

  useEffect(() => {
    if (!map) {
      return;
    }

    const sourceData = geoJsonUrl
      ? geoJsonUrl
      : geoJson
        ? geoJson
        : { type: 'FeatureCollection', features: [] };

    addSource(id, {
      type: 'geojson',
      data: sourceData,
    });
  }, [id, map, addSource, geoJson, geoJsonUrl]);

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
