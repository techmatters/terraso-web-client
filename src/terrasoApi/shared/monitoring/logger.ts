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
import { getAPIConfig } from 'terrasoApi/shared/config';

const logLevel = 'warn';

export type Severity = (typeof LOG_LEVELS)[number];
const LOG_LEVELS = ['log', 'info', 'warn', 'error'] as const;

const ORDER = _.flow(
  _.entries,
  _.map(([index, severity]) => [severity, index]),
  _.fromPairs
)(LOG_LEVELS);

const handleLog =
  (severity: Severity) =>
  (...args: any[]) => {
    console[severity](...args);
    if (ORDER[severity] >= ORDER[logLevel]) {
      getAPIConfig().logger(severity, ...args);
      return;
    }
  };

const logger = Object.fromEntries(
  LOG_LEVELS.map(severity => [severity, handleLog(severity)])
) as Record<Severity, (...args: any[]) => void>;

export default logger;
