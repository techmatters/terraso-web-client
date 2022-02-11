export const TERRASO_ENV = process.env.REACT_APP_TERRASO_ENV || 'local';

export const TERRASO_API_URL =
  process.env.REACT_APP_TERRASO_API_URL || 'http://127.0.0.1:8000';

export const GRAPH_QL_ENDPOINT = 'graphql/';

export const COOKIES_DOMAIN =
  process.env.REACT_APP_COOKIES_DOMAIN || '127.0.0.1';

export const ROLLBAR_TOKEN = process.env.REACT_APP_ROLLBAR_TOKEN;

export const AXE_TEST_TIMEOUT = process.env.REACT_AXE_TEST_TIMEOUT || 20000;
