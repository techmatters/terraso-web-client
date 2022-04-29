import { fireEvent, render, screen } from 'tests/utils';

import Navigation from 'navigation/Navigation';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

const setup = async () => {
  await render(<Navigation />, {
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

test('Navigation: Show tabs', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Landscapes' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Groups' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: Test initial', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: Test select', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes/landscape-slug',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: Test navigation', async () => {
  useLocation
    .mockReturnValueOnce({
      pathname: '/',
    })
    .mockReturnValueOnce({
      pathname: '/landscapes',
    });
  await setup();
  await act(async () =>
    fireEvent.click(screen.getByRole('link', { name: 'Landscapes' }))
  );
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).toHaveAttribute(
    'aria-current',
    'page'
  );
});
test('Navigation: none selected', async () => {
  useLocation.mockReturnValue({
    pathname: '/other',
  });
  await setup();
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Landscapes' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );
});
