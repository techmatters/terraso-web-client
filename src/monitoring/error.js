import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import logger from 'monitoring/logger';

const errorHandler = error => {
  logger.error(error.message, error.stack);
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
