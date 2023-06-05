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
import { fetchAuthURLs } from 'terrasoApi/account/accountSlice';
import { useFetchData } from './utils';

const TestComponent = () => {
  useFetchData(fetchAuthURLs);
  return <div></div>;
};

beforeEach(() => {
  global.fetch = jest.fn();
});

test('AsyncThunk: Handle error', async () => {
  global.fetch.mockRejectedValue('Test error');
  await render(<TestComponent />);
  expect(screen.getByText(/Test error/i)).toBeInTheDocument();
});
test('AsyncThunk: Handle multiple errors', async () => {
  global.fetch.mockRejectedValue(['Test error 1', 'Test error 2']);
  await render(<TestComponent />);
  expect(screen.getByText(/Test error 1/i)).toBeInTheDocument();
  expect(screen.getByText(/Test error 2/i)).toBeInTheDocument();
});
test('AsyncThunk: Complex error message', async () => {
  global.fetch.mockRejectedValue({
    content: ['common.unexpected_error'],
    params: { error: 'Unexpected' },
  });
  await render(<TestComponent />);
  expect(
    screen.getByText(
      /Oops, something went wrong. Try again in a few minutes. \(Error: Unexpected\)/i
    )
  ).toBeInTheDocument();
});
