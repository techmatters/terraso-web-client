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
import { getAuthHeaders } from 'terrasoApi/account/auth';
import { UNAUTHENTICATED } from 'terrasoApi/account/authConstants';
import { TypedDocumentString } from 'terrasoApi/gql/graphql';

import logger from 'monitoring/logger';

import { GRAPH_QL_ENDPOINT, TERRASO_API_URL } from 'config';

type Error = { message: any };
type Errors = { errors?: Error[] | null };

const parseMessage = (message: any, body: any) => {
  try {
    // If JSON return parse
    const jsonMessages =
      typeof message === 'string' ? JSON.parse(message) : message;
    return jsonMessages.map((message: any) => {
      const errorField = _.get('context.field', message);
      return {
        content: [
          message.code,
          `terraso_api.${message.code}`,
          'terraso_api.error',
          ...(errorField ? [`terraso_api.${errorField}.${message.code}`] : []),
        ],
        params: {
          code: message.code,
          ..._.omit('extra', message.context),
          context: _.get('context.extra', message),
          body,
        },
      };
    });
  } catch (error) {
    logger.warn('Failed to parse Terraso API error response', message, error);
    return message;
  }
};

type WithoutErrors<T> = Omit<NonNullable<T>, 'errors'>;
type WithoutEntryErrors<T> = { [K in keyof T]: WithoutErrors<T[K]> };

const handleApiErrors = async <T extends Errors>(
  response: T,
  body: any
): Promise<WithoutErrors<T>> => {
  if (!response.errors || response.errors.length === 0) {
    return typeof response === 'object' ? _.omit('errors', response) : response;
  }
  const unauthenticatedError = response.errors.find((error: any) =>
    _.includes('AnonymousUser', error.message)
  );
  if (unauthenticatedError) {
    return Promise.reject(UNAUTHENTICATED);
  }

  // Parsed body formData to object
  const parsedBody =
    body instanceof FormData ? JSON.parse(JSON.stringify(body)) : body;

  const messages = _.flatMap(
    error => parseMessage(error.message, parsedBody),
    response.errors
  );
  return Promise.reject(messages);
};

export const requestGraphQL = async <
  Q extends Record<string, object | null>,
  V = any
>(
  query: TypedDocumentString<Q, V> | string,
  variables?: V
): Promise<WithoutEntryErrors<Q>> => {
  const body = { query, variables };
  const jsonResponse = await request<{ data?: Q }>({
    path: GRAPH_QL_ENDPOINT,
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (jsonResponse.data === undefined) {
    logger.error(
      'Terraso API: Unexpected error',
      'received data:',
      jsonResponse
    );
    return Promise.reject(['terraso_api.error_unexpected']);
  }

  const result = {} as WithoutEntryErrors<Q>;
  for (const key of Object.keys(jsonResponse.data) as (keyof Q)[]) {
    const value = jsonResponse.data[key];
    if (value === null) {
      logger.error(
        'Terraso API: Unexpected error',
        'received data:',
        jsonResponse
      );
      return Promise.reject(['terraso_api.error_unexpected']);
    }
    result[key] = await handleApiErrors(value, body);
  }
  return result;
};

export const request = async <T>({
  path,
  body,
  headers = {},
}: {
  path: string;
  body: any;
  headers?: Record<string, string>;
}): Promise<WithoutErrors<T>> => {
  const response = await fetch(new URL(path, TERRASO_API_URL).href, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
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

  return response
    .json()
    .catch(error => {
      logger.error('Terraso API: Failed to parse response', error);
      return Promise.reject(['terraso_api.error_request_response']);
    })
    .then((resp: T & Errors) => handleApiErrors(resp, body));
};
