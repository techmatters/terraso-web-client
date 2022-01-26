import React from 'react';

import { render } from 'tests/utils';
import { rollbar } from 'monitoring/rollbar';

jest.mock('monitoring/rollbar');

global.console.error = jest.fn();

const Bomb = () => {
  throw new Error('💥 CABOOM 💥');
};

test('ErrorMonitoringProvider: component error', async () => {
  try {
    render(<Bomb />);
  } catch {
    // Nothing
  }

  expect(console.error).toHaveBeenCalledTimes(2);
  expect(
    console.error.mock.calls[1][0].startsWith(
      'The above error occurred in the <Bomb> component:'
    )
  ).toBe(true);
  expect(
    console.error.mock.calls[0][0].startsWith(
      'Error: Uncaught [Error: 💥 CABOOM 💥]'
    )
  ).toBe(true);
  expect(rollbar.error).toHaveBeenCalledTimes(1);
  const rollbarCall = rollbar.error.mock.calls[0];
  expect(rollbarCall[0]).toStrictEqual('💥 CABOOM 💥');
  console.log(rollbarCall[1]);
  expect(rollbarCall[1].startsWith('Error: 💥 CABOOM 💥')).toBe(true);
});
