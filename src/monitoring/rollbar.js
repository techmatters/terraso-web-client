import React from 'react';
import Rollbar from 'rollbar';
import { Provider, ErrorBoundary } from '@rollbar/react';

import { TERRASO_ENV, ROLLBAR_TOKEN } from 'config';

const rollbarConfig = {
  accessToken: ROLLBAR_TOKEN,
  environment: TERRASO_ENV,
};

export const logLevel = 'warn';

export const rollbar = new Rollbar(rollbarConfig);

export const RollbarProvider = props => {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary>{props.children}</ErrorBoundary>
    </Provider>
  );
};
