export const TERRASO_ENV = process.env.REACT_APP_TERRASO_ENV || 'local';

export const TERRASO_API_URL =
  process.env.REACT_APP_TERRASO_API_URL || 'http://127.0.0.1:8000';

export const GRAPH_QL_ENDPOINT = 'graphql/';

export const COOKIES_DOMAIN =
  process.env.REACT_APP_COOKIES_DOMAIN || '127.0.0.1';

export const ROLLBAR_TOKEN = process.env.REACT_APP_ROLLBAR_TOKEN;

export const WAIT_FOR_TIMEOUT = process.env.REACT_APP_WAIT_FOR_TIMEOUT || 3000;

export const JEST_TEST_TIMEOUT =
  process.env.REACT_APP_JEST_TEST_TIMEOUT || 15000;

export const AXE_TEST_TIMEOUT = process.env.REACT_APP_AXE_TEST_TIMEOUT || 20000;

export const GEOJSON_MAX_SIZE =
  process.env.REACT_APP_GEOJSON_MAX_SIZE || 1000000; // 10 MB

export const SHARED_DATA_MAX_SIZE =
  process.env.REACT_APP_SHARED_DATA_MAX_SIZE || 10000000;

export const SHARED_DATA_MAX_FILES =
  process.env.REACT_APP_SHARED_DATA_MAX_FILES || 20;

export const MAX_DESCRIPTION_LENGTH = 600;

export const MAP_DATA_ACCEPTED_TYPES = {
  'application/json': ['.json', '.geojson'],
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
