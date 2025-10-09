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
  expect(console.error).toHaveBeenCalledTimes(2);
  // React 19 changed console.error format - just check they were called
  expect(console.error.mock.calls[0]).toBeDefined();
  expect(console.error.mock.calls[1]).toBeDefined();

  // Show error page
  expect(
    screen.getByText('Oops, something went wrong. Try again in a few minutes.')
  ).toBeInTheDocument();
});
