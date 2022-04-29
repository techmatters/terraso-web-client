import { ROLLBAR_TOKEN, TERRASO_ENV } from 'config';
import Rollbar from 'rollbar';

const rollbarConfig = {
  accessToken: ROLLBAR_TOKEN,
  environment: TERRASO_ENV,
  enabled: !!ROLLBAR_TOKEN,
};

export const logLevel = 'warn';

export const rollbar = new Rollbar(rollbarConfig);
