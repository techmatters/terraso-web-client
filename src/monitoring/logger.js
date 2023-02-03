/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
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
