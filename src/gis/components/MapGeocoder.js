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

import { MAPBOX_ACCESS_TOKEN } from 'terraso-web-client/config';

const MapGeocoder = props => {
  const { position } = props;
  const { t } = useTranslation();
  const { map } = useMap();
  useEffect(() => {
    if (!map) {
      return;
    }
    const geocoder = new MapboxGlGeocoder({
      accessToken: MAPBOX_ACCESS_TOKEN,
      marker: false,
      placeholder: t('storyMap.form_location_dialog_geocoder_placeholder'),
      mapboxgl,
    });
    map.addControl(geocoder, position);
  }, [map, t, position]);
  return null;
};

export default MapGeocoder;
