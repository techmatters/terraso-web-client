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

import {
  UPLOAD_STATUS_ERROR,
  UPLOAD_STATUS_SUCCESS,
  UPLOAD_STATUS_UPLOADING,
} from 'sharedData/sharedDataSlice';

import { VALIDATION_SCHEMA as LINK_VALIDATION_SCHEMA } from './ShareDataLinks';

export const groupDataEntryUploadsByStatus = uploads => {
  const byStatus = _.flow(
    _.toPairs,
    _.groupBy(([id, result]) => result.status),
    _.toPairs,
    _.map(([status, statusEntries]) => [
      status,
      _.flow(
        _.map(([id, result]) => [id, result.data]),
        _.fromPairs
      )(statusEntries),
    ]),
    _.fromPairs
  )(uploads);
  return {
    apiErrors: byStatus[UPLOAD_STATUS_ERROR],
    apiSuccesses: byStatus[UPLOAD_STATUS_SUCCESS],
    apiUploading: byStatus[UPLOAD_STATUS_UPLOADING],
  };
};

export const validateLink = link => {
  try {
    LINK_VALIDATION_SCHEMA.validateSync(link);
    return LINK_VALIDATION_SCHEMA.cast(link);
  } catch {
    return null;
  }
};
