import _ from 'lodash/fp';

import {
  UPLOAD_STATUS_ERROR,
  UPLOAD_STATUS_SUCCESS,
  UPLOAD_STATUS_UPLOADING,
} from 'sharedData/sharedDataSlice';

export const groupByStatus = uploads => {
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
