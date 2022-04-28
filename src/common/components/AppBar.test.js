// prettier-ignore
import { fireEvent, render, screen } from 'tests/utils';

import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from 'common/components/AppBar';
import Cookies from 'js-cookie';
import React from 'react';
import { act } from 'react-dom/test-utils';

jest.mock('@mui/material/useMediaQuery');
jest.mock('js-cookie');

const setup = async () => {
  await render(<AppBar />, {
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
  });
};

beforeEach(() => {
  global.fetch = jest.fn();
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
  expect(screen.getByRole('img', { name: 'Terraso' })).toHaveAttribute(
    'src',
    'logo.svg'
  );
});
test('AppBar: Logo display (small)', async () => {
  useMediaQuery.mockReturnValue(true);
  await setup();
  expect(screen.getByRole('img', { name: 'Terraso' })).toHaveAttribute(
    'src',
    'logo-square.svg'
  );
});
test('AppBar: Sign out', async () => {
  global.fetch.mockResolvedValueOnce({
    status: 200,
  });
  useMediaQuery.mockReturnValue(false);
  await setup();
  expect(screen.getByRole('img', { name: 'Terraso' })).toHaveAttribute(
    'src',
    'logo.svg'
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
  );
  expect(Cookies.remove).toHaveBeenCalledTimes(2);
  const saveCall = Cookies.remove.mock.calls[1];
  expect(saveCall[1]).toStrictEqual({
    domain: '127.0.0.1',
    path: '/',
  });
});
