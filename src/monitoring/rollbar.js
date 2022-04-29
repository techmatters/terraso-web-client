import Rollbar from 'rollbar';

import { ROLLBAR_TOKEN, TERRASO_ENV } from 'config';

const rollbarConfig = {
  accessToken: ROLLBAR_TOKEN,
  environment: TERRASO_ENV,
  enabled: !!ROLLBAR_TOKEN,
};

export const logLevel = 'warn';

export const rollbar = new Rollbar(rollbarConfig);
