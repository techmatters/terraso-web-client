import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import logger from 'monitoring/logger';
import UnexpectedError from 'common/components/UnexpectedError';

const errorHandler = error => {
  logger.error(error.message, error.stack);
};

const ErrorMonitoringProvider = props => {
  return (
    <ErrorBoundary FallbackComponent={UnexpectedError} onError={errorHandler}>
      {props.children}
    </ErrorBoundary>
  );
};

export default ErrorMonitoringProvider;
