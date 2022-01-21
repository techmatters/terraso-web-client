import _ from 'lodash';

import { getToken } from 'account/auth';
import { TERRASO_API_URL, GRAPH_QL_ENDPOINT } from 'config';
import { UNAUTHENTICATED } from 'account/authConstants';

const handleGraphQLError = data => {
  const errors = _.get(data, 'errors');
  const messages = errors.map(error => error.message);
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
    console.error('Terraso API: Failed to execute request', error);
    return Promise.reject(['terraso_api.error_request_response']);
  });

  if (response.status === 401) {
    await Promise.reject(UNAUTHENTICATED);
  }

  const jsonResponse = await response.json().catch(error => {
    console.error('Terraso API: Failed to parse response', error);
    return Promise.reject(['terraso_api.error_request_response']);
  });

  if (_.has(jsonResponse, 'errors')) {
    await handleGraphQLError(jsonResponse);
  }

  if (!_.has(jsonResponse, 'data')) {
    console.error(
      'Terraso API: Unexpected error',
      'received data:',
      jsonResponse
    );
    await Promise.reject(['terraso_api.error_unexpected']);
  }

  return jsonResponse.data;
};
