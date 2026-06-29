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

import { useEffect } from 'react';
import MapboxGlGeocoder from '@mapbox/mapbox-gl-geocoder';

import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import { useTranslation } from 'react-i18next';

import { useMap } from 'terraso-web-client/gis/components/Map';
import mapboxgl from 'terraso-web-client/gis/mapbox';
import { getCoordinateSearchResults } from 'terraso-web-client/gis/mapGeocoderUtils';

import { MAPBOX_ACCESS_TOKEN } from 'terraso-web-client/config';

const renderCoordinateResult = result =>
  `<div class="mapboxgl-ctrl-geocoder__result-coordinate">${result.place_name}</div>`;

const getCoordinateQueryValue = result =>
  result.properties?.coordinateQuery || result.place_name;

const MapGeocoder = props => {
  const { position } = props;
  const { t } = useTranslation();
  const { map } = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const formatCoordinateResultLabel = ({ latitude, longitude }) =>
      t('storyMap.form_location_dialog_geocoder_coordinate_result', {
        latitude,
        longitude,
      });

    const geocoder = new MapboxGlGeocoder({
      accessToken: MAPBOX_ACCESS_TOKEN,
      localGeocoder: query =>
        getCoordinateSearchResults(query, formatCoordinateResultLabel),
      getItemValue: result =>
        result.properties?.coordinateSearch
          ? getCoordinateQueryValue(result)
          : result.place_name,
      marker: false,
      placeholder: t('storyMap.form_location_dialog_geocoder_placeholder'),
      render: result =>
        result.properties?.coordinateSearch
          ? renderCoordinateResult(result)
          : undefined,
      mapboxgl,
    });
    map.addControl(geocoder, position);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map, t, position]);
  return null;
};

export default MapGeocoder;
