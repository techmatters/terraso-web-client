/*
 * Copyright © 2026 Technology Matters
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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import { useNavigate } from 'react-router';
import useMediaQuery from '@mui/material/useMediaQuery';

import PublishedStoryMapFooter from 'terraso-web-client/layout/PublishedStoryMapFooter';

jest.mock('@mui/material/useMediaQuery');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

const setup = async (
  initialState = {
    account: {
      hasToken: false,
      currentUser: {
        fetching: false,
        data: {},
      },
    },
  }
) => {
  useMediaQuery.mockReturnValue(false);
  await render(<PublishedStoryMapFooter />, initialState);
};

beforeEach(() => {
  useNavigate.mockReturnValue(jest.fn());
});

test('PublishedStoryMapFooter: About link targets the about page', async () => {
  await setup();

  expect(screen.getByRole('link', { name: 'About Terraso' })).toHaveAttribute(
    'href',
    'https://terraso.org/about'
  );
});

test('PublishedStoryMapFooter: Sign in redirects to account without a referrer', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  await setup();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  );

  expect(navigate).toHaveBeenCalledWith('/account');
});
