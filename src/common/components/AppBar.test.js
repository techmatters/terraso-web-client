import React from 'react';
import { act } from 'react-dom/test-utils';
import useMediaQuery from '@mui/material/useMediaQuery';
import Cookies from 'js-cookie';

import { render, screen, fireEvent } from 'tests/utils';
import AppBar from 'common/components/AppBar';

jest.mock('@mui/material/useMediaQuery');
jest.mock('js-cookie');

const setup = async () => {
  await act(async () =>
    render(<AppBar />, {
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
    })
  );
};

test('AppBar: Dont display if no user', async () => {
  await act(async () =>
    render(<AppBar />, {
      account: {
        hasToken: true,
        currentUser: {
          fetching: false,
          data: null,
        },
      },
    })
  );
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
