import _ from 'lodash/fp';

import logger from 'monitoring/logger';

import { getToken } from 'account/auth';
import { UNAUTHENTICATED } from 'account/authConstants';

import { GRAPH_QL_ENDPOINT, TERRASO_API_URL } from 'config';

const parseMessage = (message, inputData) => {
  try {
    // If JSON return parsed
    const jsonMessages = JSON.parse(message);
    return jsonMessages.map(message => ({
      content: [
        message.code,
        `terraso_api.${message.code}`,
        'terraso_api.error',
      ],
      params: {
        code: message.code,
        ..._.omit('extra', message.context),
        context: _.get('context.extra', message),
        inputData,
      },
    }));
  } catch (error) {
    logger.warn('Failed to parse Terraso API error response', message, error);
    return message;
  }
};

const handleGraphQLError = (data, inputData) => {
  const errors = _.get('errors', data);
  const messages = _.flatMap(
    error => parseMessage(error.message, inputData),
    errors
  );
  return Promise.reject(messages);
};

export const requestGraphQL = async (query, variables) => {
  const jsonResponse = await request({
    path: GRAPH_QL_ENDPOINT,
    body: JSON.stringify({ query, variables }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (_.has('errors', jsonResponse)) {
    await handleGraphQLError(jsonResponse, variables);
  }

  if (!_.has('data', jsonResponse)) {
    logger.error(
      'Terraso API: Unexpected error',
      'received data:',
      jsonResponse
    );
    await Promise.reject(['terraso_api.error_unexpected']);
  }

  return jsonResponse.data;
};

export const request = async ({ path, body, headers = {} }) => {
  const response = await fetch(new URL(path, TERRASO_API_URL).href, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...headers,
    },
    body,
  }).catch(error => {
    logger.error('Terraso API: Failed to execute request', error);
    return Promise.reject(['terraso_api.error_request_response']);
  });

  if (response.status === 401) {
    await Promise.reject(UNAUTHENTICATED);
  }

  return await response.json().catch(error => {
    logger.error('Terraso API: Failed to parse response', error);
    return Promise.reject(['terraso_api.error_request_response']);
  });
};
