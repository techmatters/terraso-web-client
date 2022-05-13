export const TERRASO_ENV = process.env.REACT_APP_TERRASO_ENV || 'local';

export const TERRASO_API_URL =
  process.env.REACT_APP_TERRASO_API_URL || 'http://127.0.0.1:8000';

export const GRAPH_QL_ENDPOINT = 'graphql/';

export const COOKIES_DOMAIN =
  process.env.REACT_APP_COOKIES_DOMAIN || '127.0.0.1';

export const ROLLBAR_TOKEN = process.env.REACT_APP_ROLLBAR_TOKEN;

export const JEST_TEST_TIMEOUT = process.env.REACT_JEST_TEST_TIMEOUT || 10000;

export const AXE_TEST_TIMEOUT = process.env.REACT_AXE_TEST_TIMEOUT || 20000;

export const GEOJSON_MAX_SIZE = process.env.REACT_GEOJSON_MAX_SIZE || 1000000;

export const HUBSPOT_FORMS = {
  region: process.env.REACT_APP_HUBSPOT_FORMS_REGION || 'na1',
  portalId: process.env.REACT_APP_HUBSPOT_FORMS_PORTAL_ID,
  contactForm: {
    'en-US': process.env.REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_EN,
    'es-ES': process.env.REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_ES,
  },
};

export const PLAUSIBLE_DOMAIN = process.env.REACT_APP_PLAUSIBLE_DOMAIN;
