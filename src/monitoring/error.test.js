// prettier-ignore
import { render, screen } from 'tests/utils';

import { rollbar } from 'monitoring/rollbar';
import React from 'react';

jest.mock('monitoring/rollbar');

global.console.error = jest.fn();

const Bomb = () => {
  throw new Error('💥 CABOOM 💥');
};

test('ErrorMonitoringProvider: component error', async () => {
  try {
    await render(<Bomb />);
  } catch {
    // Nothing
  }

  // Browser console
  expect(console.error).toHaveBeenCalledTimes(3);
  expect(
    console.error.mock.calls[0][0].startsWith(
      'Error: Uncaught [Error: 💥 CABOOM 💥]'
    )
  ).toBe(true);
  expect(
    console.error.mock.calls[1][0].startsWith(
      'The above error occurred in the <Bomb> component:'
    )
  ).toBe(true);
  expect(console.error.mock.calls[2][0]).toStrictEqual('💥 CABOOM 💥');

  // Rollbar
  expect(rollbar.error).toHaveBeenCalledTimes(1);
  const rollbarCall = rollbar.error.mock.calls[0];
  expect(rollbarCall[0]).toStrictEqual('💥 CABOOM 💥');
  expect(rollbarCall[1].startsWith('Error: 💥 CABOOM 💥')).toBe(true);

  // Show error page
  expect(
    screen.getByText(
      'Oops, something went wrong. Please try it again in a few minutes.'
    )
  ).toBeInTheDocument();
});
