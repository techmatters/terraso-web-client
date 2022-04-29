import _ from 'lodash/fp';

import { logLevel, rollbar } from 'monitoring/rollbar';

const LOG_LEVELS = ['log', 'info', 'warn', 'error'];

const ORDER = _.flow(
  _.entries,
  _.map(([index, severity]) => [severity, index]),
  _.fromPairs
)(LOG_LEVELS);

export const sendToRollbar = (severity, ...args) => rollbar[severity](...args);

const handleLog =
  severity =>
  (...args) => {
    console[severity](...args);
    if (ORDER[severity] >= ORDER[logLevel]) {
      rollbar[severity](...args);
      return;
    }
  };

const logger = _.flow(
  _.map(severity => [severity, handleLog(severity)]),
  _.fromPairs
)(LOG_LEVELS);

export default logger;
