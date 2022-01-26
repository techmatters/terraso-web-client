import Rollbar from 'rollbar';

import { TERRASO_ENV, ROLLBAR_TOKEN } from 'config';

const rollbarConfig = {
  accessToken: ROLLBAR_TOKEN,
  environment: TERRASO_ENV,
};

export const logLevel = 'warn';

export const rollbar = new Rollbar(rollbarConfig);
