/*
 * Copyright © 2023 Technology Matters
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
import { useLocation } from 'react-router-dom';

import OptionalAuth from './OptionalAuth';
import OptionalAuthBottomMessage from './OptionalAuthBottomMessage';
import OptionalAuthTopMessage from './OptionalAuthTopMessage';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

const setup = async initialState => {
  await render(
    <>
      <OptionalAuthTopMessage />
      <OptionalAuth>
        <div>Test</div>
      </OptionalAuth>
      <OptionalAuthBottomMessage />
    </>,
    initialState
  );
};

test('OptionalAuth: Display messages', async () => {
  useLocation.mockReturnValue({
    pathname: '/tools/story-maps/jqbb8ss/test-story',
  });
  await setup();

  expect(screen.getByRole('link', { name: 'Join Terraso' })).toHaveAttribute(
    'href',
    '/account?referrer=%2Ftools%2Fstory-maps%2Fjqbb8ss%2Ftest-story'
  );
  expect(
    screen.getByText(/and create your own story map for free/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Liked the story map\? Create one by/i)
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'signing up for Terraso' })
  ).toHaveAttribute(
    'href',
    '/account?referrer=%2Ftools%2Fstory-maps%2Fjqbb8ss%2Ftest-story'
  );
});

test('OptionalAuth: Dont Display messages', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes',
  });
  await setup();

  expect(
    screen.queryByRole('link', { name: 'Join Terraso' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/and create your own story map for free/i)
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Liked the story map\? Create your own story map by/i)
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'signing up for Terraso for free' })
  ).not.toBeInTheDocument();
});
