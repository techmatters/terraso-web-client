export const TERRASO_ENV = process.env.REACT_APP_TERRASO_ENV || 'local';

export const TERRASO_API_URL =
  process.env.REACT_APP_TERRASO_API_URL || 'http://127.0.0.1:8000';

export const GRAPH_QL_ENDPOINT = 'graphql/';

export const COOKIES_DOMAIN =
  process.env.REACT_APP_COOKIES_DOMAIN || '127.0.0.1';

export const ROLLBAR_TOKEN = process.env.REACT_APP_ROLLBAR_TOKEN;

export const AXE_TEST_TIMEOUT = process.env.REACT_AXE_TEST_TIMEOUT || 20000;

export const GEOJSON_MAX_SIZE = process.env.REACT_GEOJSON_MAX_SIZE || 1000000;

export const HUBSPOT_FORMS = {
  region: process.env.REACT_HUBSPOT_FORMS_REGION || 'na1',
  portalId: process.env.REACT_HUBSPOT_FORMS_PORTAL_ID || '9151742',
  contactForm: {
    'en-US':
      process.env.REACT_HUBSPOT_FORMS_CONTACT_FORM_EN ||
      '042cf4a6-3dd2-4643-b702-7b14383035ec',
    'es-ES':
      process.env.REACT_HUBSPOT_FORMS_CONTACT_FORM_ES ||
      'f9fbdacd-c995-4611-9ba0-6f2910f03b15',
  },
};
