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
import Cookies from 'js-cookie';
import { setAPIConfig } from 'terraso-client-shared/config';
import type { Severity } from 'terraso-client-shared/monitoring/logger';
import { rollbar } from 'monitoring/rollbar';

export const TERRASO_ENV = process.env.REACT_APP_TERRASO_ENV || 'local';

export const TERRASO_API_URL =
  process.env.REACT_APP_TERRASO_API_URL || 'http://127.0.0.1:8000';

export const REACT_APP_BASE_URL =
  process.env.REACT_APP_BASE_URL || 'http://127.0.0.1:3000';

export const GRAPHQL_ENDPOINT = 'graphql/';

export const COOKIES_DOMAIN =
  process.env.REACT_APP_COOKIES_DOMAIN || '127.0.0.1';

const COOKIES_PARAMS = { path: '/', domain: COOKIES_DOMAIN };

export const ROLLBAR_TOKEN = process.env.REACT_APP_ROLLBAR_TOKEN;

setAPIConfig({
  terrasoAPIURL: TERRASO_API_URL,
  graphQLEndpoint: GRAPHQL_ENDPOINT,
  tokenStorage: {
    getToken: Cookies.get,
    removeToken: name => Cookies.remove(name, COOKIES_PARAMS),
    setToken: (name, token) => Cookies.set(name, token, COOKIES_PARAMS),
  },
  logger: (severity: Severity, ...args) => rollbar[severity](...args),
});

export const WAIT_FOR_TIMEOUT = process.env.REACT_APP_WAIT_FOR_TIMEOUT || 3000;

export const JEST_TEST_TIMEOUT =
  process.env.REACT_APP_JEST_TEST_TIMEOUT || 15000;

export const AXE_TEST_TIMEOUT = process.env.REACT_APP_AXE_TEST_TIMEOUT || 20000;

export const GEOJSON_MAX_SIZE =
  process.env.REACT_APP_GEOJSON_MAX_SIZE || 10000000; // 10 MB

export const SHARED_DATA_MAX_SIZE =
  process.env.REACT_APP_SHARED_DATA_MAX_SIZE || 10000000;

export const SHARED_DATA_MAX_FILES =
  process.env.REACT_APP_SHARED_DATA_MAX_FILES || 20;

export const MAX_DESCRIPTION_LENGTH = 600;

export const MAP_DATA_ACCEPTED_TYPES_NAMES = [
  'GeoJSON',
  'JSON',
  'KML',
  'KMZ',
  'ESRI Shapefile',
];

export const MAP_DATA_ACCEPTED_TYPES = {
  'application/json': ['.json', '.geojson'],
  'application/xml': ['.kml'],
  'application/zip': ['.kmz', '.zip'],
};

export const MAP_DATA_ACCEPTED_EXTENSIONS = Object.values(
  MAP_DATA_ACCEPTED_TYPES
)
  .flat()
  .map(ext => ext.substr(1))
  .sort();

export const SHARED_DATA_ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/msword': ['.doc'],
  'application/pdf': ['.pdf'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    '.pptx',
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'application/json': ['.json', '.geojson'],
  'application/xml': ['.kml', '.gpx'],
  'application/zip': ['.kmz', '.zip'],
};

export const SHARED_DATA_ACCEPTED_EXTENSIONS = Object.values(
  SHARED_DATA_ACCEPTED_TYPES
)
  .flat()
  .map(ext => ext.substr(1))
  .sort();

export const IMAGE_ACCEPTED_EXTENSIONS = (
  process.env.REACT_APP_IMAGE_ACCEPTED_EXTENSIONS || 'jpg,jpeg'
).split(',');

export const HUBSPOT_FORMS = {
  region: process.env.REACT_APP_HUBSPOT_FORMS_REGION || 'na1',
  portalId: process.env.REACT_APP_HUBSPOT_FORMS_PORTAL_ID,
  contactForm: {
    'en-US': process.env.REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_EN,
    'es-ES': process.env.REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_ES,
  },
};

export const PLAUSIBLE_DOMAIN = process.env.REACT_APP_PLAUSIBLE_DOMAIN;

export const LANDSCAPE_PROFILE_IMAGE_MAX_SIZE =
  process.env.REACT_APP_LANDSCAPE_PROFILE_IMAGE_MAX_SIZE || 10000000; // 10 MB

// List of livelihoods that, if selected, will show the agricultural production method field
export const AGRICULTURAL_PRODUCTION_METHOD_LIVELIHOODS = process.env
  .REACT_APP_AGRICULTURAL_PRODUCTION_METHOD_LIVELIHOODS || [
  'Cattle and livestock farming',
  'Crop farming',
];

export const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
export const MAPBOX_STYLE_DEFAULT =
  process.env.REACT_APP_MAPBOX_STYLE_DEFAULT ||
  'mapbox://styles/mapbox/satellite-v9';
export const MAPBOX_PROJECTION_DEFAULT =
  process.env.REACT_APP_MAPBOX_PROJECTION_DEFAULT || 'globe';
export const MAPBOX_LANDSCAPE_DIRECTORY_STYLE =
  process.env.REACT_APP_MAPBOX_LANDSCAPE_DIRECTORY_STYLE ||
  MAPBOX_STYLE_DEFAULT;

export const STORY_MAP_INSET_STYLE = 'mapbox://styles/mapbox/dark-v10';
export const STORY_MAP_MEDIA_MAX_SIZE = 10000000; // 10 MB
export const STORY_MAP_MEDIA_ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/aac': ['.aac'],
};
export const STORY_MAP_MEDIA_ACCEPTED_EXTENSIONS = Object.values(
  STORY_MAP_MEDIA_ACCEPTED_TYPES
)
  .flat()
  .map(ext => ext.substr(1))
  .sort();
