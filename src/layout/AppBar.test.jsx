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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';
import Cookies from 'js-cookie';
import { useLocation, useNavigate } from 'react-router';
import useMediaQuery from '@mui/material/useMediaQuery';

import AppBar from 'terraso-web-client/layout/AppBar';
import { useOptionalAuth } from 'terraso-web-client/navigation/components/Routes';

jest.mock('@mui/material/useMediaQuery');
jest.mock('js-cookie');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('terraso-web-client/navigation/components/Routes', () => ({
  ...jest.requireActual('terraso-web-client/navigation/components/Routes'),
  useOptionalAuth: jest.fn(),
}));

const setup = async (
  initialState = {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'First',
          lastName: 'Last',
        },
      },
    },
  },
  props
) => {
  await render(<AppBar {...props} />, initialState);
};

const mockMobileViewport = isNarrowMobile => {
  useMediaQuery.mockImplementation(
    query =>
      query.includes('949.95px') ||
      (query === '(max-width:299px)' && isNarrowMobile)
  );
};

beforeEach(() => {
  global.fetch = jest.fn();
  useNavigate.mockReturnValue(jest.fn());
  useOptionalAuth.mockReturnValue({
    enabled: false,
  });
  useLocation.mockReturnValue({
    pathname: '/groups',
    search: '?sort=-name&other=1',
  });
});

test('AppBar: Dont display if no user', async () => {
  await render(<AppBar />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: null,
      },
    },
  });

  expect(() => screen.getByAltText(/Terraso/i)).toThrow(
    'Unable to find an element'
  );
});
test('AppBar: Display terraso title', async () => {
  await setup();
  expect(screen.getByAltText(/Terraso/i)).toBeInTheDocument();
});
test('AppBar: Logo display', async () => {
  useMediaQuery.mockReturnValue(false);
  await setup();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    'logo-story-maps.svg'
  );
});
test('AppBar: Logo display (small)', async () => {
  useMediaQuery.mockReturnValue(true);
  await setup();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    'logo-story-maps.svg'
  );
});
test('AppBar: Sign out', async () => {
  global.fetch.mockResolvedValueOnce({
    status: 200,
  });
  useMediaQuery.mockReturnValue(false);
  await setup();
  expect(screen.getByRole('img', { name: /Terraso/i })).toHaveAttribute(
    'src',
    'logo-story-maps.svg'
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
  );
  expect(Cookies.remove).toHaveBeenCalledTimes(4);
  const saveCall = Cookies.remove.mock.calls[0];
  expect(saveCall[1]).toStrictEqual({
    path: '/',
    expires: 30,
  });
  const saveCall2 = Cookies.remove.mock.calls[1];
  expect(saveCall2[1]).toStrictEqual({
    domain: 'localhost',
    path: '/',
    expires: 30,
  });
});

test('AppBar: Add sign in referrer', async () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);

  useOptionalAuth.mockReturnValue({
    enabled: true,
  });

  global.fetch.mockResolvedValueOnce({
    status: 200,
  });
  useMediaQuery.mockReturnValue(false);
  await setup({
    account: {
      hasToken: false,
      currentUser: {
        fetching: false,
        data: {},
      },
    },
  });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  );

  expect(navigate).toHaveBeenCalledWith(
    '/account?referrer=%2Fgroups%3Fsort%3D-name%26other%3D1'
  );
});

test('AppBar: Mobile account menu sign out', async () => {
  global.fetch.mockResolvedValueOnce({
    status: 200,
  });
  mockMobileViewport(false);
  await setup();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Account Profile' }))
  );

  await act(async () =>
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign Out' }))
  );

  expect(Cookies.remove).toHaveBeenCalledTimes(4);
});

test('AppBar: Mobile navigation menu', async () => {
  mockMobileViewport(false);
  await setup(undefined, { showInlineNavigation: false });

  const localePicker = screen.getByRole('combobox', {
    name: /Selected language:/,
  });
  const navigationButton = screen.getByRole('button', { name: 'Main' });

  expect(
    localePicker.compareDocumentPosition(navigationButton) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();

  await act(async () => fireEvent.click(navigationButton));

  expect(screen.getByRole('menuitem', { name: 'Home' })).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'Story Maps' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'Landscapes' })
  ).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Groups' })).toBeInTheDocument();
});

test('AppBar: Mobile widths below 300px move account actions into navigation menu', async () => {
  global.fetch.mockResolvedValueOnce({
    status: 200,
  });
  mockMobileViewport(true);
  await setup(undefined, { showInlineNavigation: false });

  expect(
    screen.queryByRole('button', { name: 'Account Profile' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: /Selected language:/ })
  ).not.toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Main' }))
  );

  expect(
    screen.getByRole('combobox', { name: /Selected language:/ })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'First Last' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'Sign Out' })
  ).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign Out' }))
  );

  expect(Cookies.remove).toHaveBeenCalledTimes(4);
});
