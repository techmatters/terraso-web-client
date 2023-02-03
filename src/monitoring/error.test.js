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
import { render, screen } from 'tests/utils';

import React from 'react';

import { rollbar } from 'monitoring/rollbar';

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
  expect(console.error).toHaveBeenCalledTimes(4);
  expect(
    console.error.mock.calls[0][0].startsWith(
      'Error: Uncaught [Error: 💥 CABOOM 💥]'
    )
  ).toBe(true);
  expect(
    console.error.mock.calls[1][0].startsWith(
      'Error: Uncaught [Error: 💥 CABOOM 💥]'
    )
  ).toBe(true);
  expect(
    console.error.mock.calls[2][0].startsWith(
      'The above error occurred in the <Bomb> component:'
    )
  ).toBe(true);
  expect(console.error.mock.calls[3][0]).toStrictEqual('💥 CABOOM 💥');

  // Rollbar
  expect(rollbar.error).toHaveBeenCalledTimes(1);
  const rollbarCall = rollbar.error.mock.calls[0];
  expect(rollbarCall[0]).toStrictEqual('💥 CABOOM 💥');
  expect(rollbarCall[1].startsWith('Error: 💥 CABOOM 💥')).toBe(true);

  // Show error page
  expect(
    screen.getByText('Oops, something went wrong. Try again in a few minutes.')
  ).toBeInTheDocument();
});
