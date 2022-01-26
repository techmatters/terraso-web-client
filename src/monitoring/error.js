import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { rollbar } from 'monitoring/rollbar';

const errorHandler = error => {
  rollbar.error(error.message, error.stack);
};

const ErrorMonitoringProvider = props => {
  return (
    <ErrorBoundary
      FallbackComponent={() => <div>Unexpected error</div>}
      onError={errorHandler}
    >
      {props.children}
    </ErrorBoundary>
  );
};

export default ErrorMonitoringProvider;
