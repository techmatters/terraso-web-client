import React from 'react';
import { Provider, ErrorBoundary, LEVEL_WARN } from '@rollbar/react';

import { TERRASO_ENV, ROLLBAR_TOKEN } from 'config';

const rollbarConfig = {
  accessToken: ROLLBAR_TOKEN,
  environment: TERRASO_ENV,
};

const RollbarProvider = props => {
  return (
    <Provider config={rollbarConfig}>
      <ErrorBoundary level={LEVEL_WARN}>{props.children}</ErrorBoundary>
    </Provider>
  );
};

export default RollbarProvider;
