import { rollbar } from 'monitoring/rollbar';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('monitoring/rollbar');

global.fetch = jest.fn();
global.console.error = jest.fn();

test('Terraso API: request error', async () => {
  global.console.warn = jest.fn();
  global.fetch.mockRejectedValue('Test Error');
  await expect(terrasoApi.request()).rejects.toEqual([
    'terraso_api.error_request_response',
  ]);
  expect(console.error).toHaveBeenCalledTimes(1);
  expect(rollbar.error).toHaveBeenCalledTimes(1);
});
test('Terraso API: request format error', async () => {
  global.fetch.mockResolvedValue({
    json: () => Promise.reject('Format error'),
  });
  await expect(terrasoApi.request()).rejects.toEqual([
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
  await expect(terrasoApi.request()).rejects.toEqual(['Test error']);
  expect(console.error).toHaveBeenCalledTimes(0);
  expect(rollbar.error).toHaveBeenCalledTimes(0);
});
test('Terraso API: no data error', async () => {
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({}),
  });
  await expect(terrasoApi.request()).rejects.toEqual([
    'terraso_api.error_unexpected',
  ]);
  expect(console.error).toHaveBeenCalledTimes(1);
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
  const result = await terrasoApi.request();
  expect(result).toEqual({ test: 'value' });
  expect(console.error).toHaveBeenCalledTimes(0);
  expect(rollbar.error).toHaveBeenCalledTimes(0);
});
