﻿/*
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

import { rollbar } from 'monitoring/rollbar';

import * as terrasoApi from 'terrasoBackend/api';

jest.mock('monitoring/rollbar');

global.fetch = jest.fn();
global.console.error = jest.fn();

test('Terraso API: request error', async () => {
  global.console.warn = jest.fn();
  global.fetch.mockRejectedValue('Test Error');
  await expect(terrasoApi.requestGraphQL()).rejects.toEqual([
    'terraso_api.error_request_response',
  ]);
  expect(console.error).toHaveBeenCalledTimes(1);
  expect(rollbar.error).toHaveBeenCalledTimes(1);
});
test('Terraso API: request format error', async () => {
  global.fetch.mockResolvedValue({
    json: () => Promise.reject('Format error'),
  });
  await expect(terrasoApi.requestGraphQL()).rejects.toEqual([
    'terraso_api.error_request_response',
  ]);
  expect(console.error).toHaveBeenCalledTimes(1);
  expect(rollbar.error).toHaveBeenCalledTimes(1);
});
test('Terraso API: request GraphQL errors', async () => {
  global.fetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        errors: [
          {
            message: 'Test error',
          },
        ],
      }),
  });
  await expect(terrasoApi.requestGraphQL()).rejects.toEqual(['Test error']);
  expect(console.error).toHaveBeenCalledTimes(0);
  expect(rollbar.error).toHaveBeenCalledTimes(0);
});
test('Terraso API: no data error', async () => {
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({}),
  });
  await expect(terrasoApi.requestGraphQL()).rejects.toEqual([
    'terraso_api.error_unexpected',
  ]);
  expect(console.error).toHaveBeenCalledTimes(1);
});
test('Terraso API: mutation errors', async () => {
  global.fetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        data: {
          testMutation: {
            errors: [{ message: 'Test error' }],
          },
        },
      }),
  });
  await expect(terrasoApi.requestGraphQL()).rejects.toEqual(['Test error']);
});
test('Terraso API: No mutation errors', async () => {
  global.fetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        data: {
          testMutation: {
            errors: null,
          },
        },
      }),
  });
  const result = await terrasoApi.requestGraphQL();
  expect(result).toEqual({ testMutation: { errors: null } });
});
test('Terraso API: success', async () => {
  global.fetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        data: {
          test: 'value',
        },
      }),
  });
  const result = await terrasoApi.requestGraphQL();
  expect(result).toEqual({ test: 'value' });
  expect(console.error).toHaveBeenCalledTimes(0);
  expect(rollbar.error).toHaveBeenCalledTimes(0);
});
