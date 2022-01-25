import React from 'react';

import { render } from 'tests/utils';

const Bomb = () => {
  throw new Error('💥 CABOOM 💥');
};

global.console.error = jest.fn();

test('Rollbar: component error', async () => {
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
});
