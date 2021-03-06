import _ from 'lodash/fp';

import logger from 'monitoring/logger';

import { getToken } from 'account/auth';
import { UNAUTHENTICATED } from 'account/authConstants';

import { GRAPH_QL_ENDPOINT, TERRASO_API_URL } from 'config';

const parseMessage = (message, body) => {
  try {
    // If JSON return parse
    const jsonMessages =
      typeof message === 'string' ? JSON.parse(message) : message;
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
        body,
      },
    }));
  } catch (error) {
    logger.warn('Failed to parse Terraso API error response', message, error);
    return message;
  }
};

const handleApiErrors = (data, body) => {
  const errors = _.get('errors', data);

  const unauthenticatedError = errors.find(error =>
    _.includes('AnonymousUser', error.message)
  );
  if (unauthenticatedError) {
    return Promise.reject(UNAUTHENTICATED);
  }

  const messages = _.flatMap(
    error => parseMessage(error.message, body),
    errors
  );
  return Promise.reject(messages);
};

export const requestGraphQL = async (query, variables) => {
  const jsonResponse = await request({
    path: GRAPH_QL_ENDPOINT,
    body: { query, variables },
    headers: {
      'Content-Type': 'application/json',
    },
  });

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
    body: body instanceof FormData ? body : JSON.stringify(body),
  }).catch(error => {
    logger.error('Terraso API: Failed to execute request', error);
    return Promise.reject(['terraso_api.error_request_response']);
  });

  if (response.status === 401) {
    await Promise.reject(UNAUTHENTICATED);
  }

  const jsonResponse = await response.json().catch(error => {
    logger.error('Terraso API: Failed to parse response', error);
    return Promise.reject(['terraso_api.error_request_response']);
  });

  if (_.has('errors', jsonResponse)) {
    await handleApiErrors(jsonResponse, body);
  }

  return jsonResponse;
};
