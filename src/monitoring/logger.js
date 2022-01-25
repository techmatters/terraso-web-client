import _ from 'lodash/fp';

import { rollbar, logLevel } from 'monitoring/rollbar';

const LOG_LEVELS = ['log', 'info', 'warn', 'error'];

const handleLog =
  severity =>
  (...args) => {
    console[severity](...args);
    if (LOG_LEVELS.indexOf(severity) >= LOG_LEVELS.indexOf(logLevel)) {
      rollbar[severity](...args);
      return;
    }
  };

const logger = _.flow(
  _.map(severity => [severity, handleLog(severity)]),
  _.fromPairs
)(LOG_LEVELS);

export default logger;
