import _ from 'lodash/fp';

import { getToken } from 'account/auth';
import logger from 'monitoring/logger';
import { TERRASO_API_URL, GRAPH_QL_ENDPOINT } from 'config';
import { UNAUTHENTICATED } from 'account/authConstants';

const parseMessage = message => {
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
      },
    }));
  } catch (error) {
    return message;
  }
};

const handleGraphQLError = data => {
  const errors = _.get('errors', data);
  const messages = _.flatMap(error => parseMessage(error.message), errors);
  return Promise.reject(messages);
};

export const request = async (query, variables) => {
  const response = await fetch(
    new URL(GRAPH_QL_ENDPOINT, TERRASO_API_URL).href,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    }
  ).catch(error => {
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
    await handleGraphQLError(jsonResponse);
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
