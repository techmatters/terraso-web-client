import React from 'react';
import { act } from 'react-dom/test-utils';
import { useLocation } from 'react-router-dom';

import { render, screen, fireEvent } from 'tests/utils';
import Navigation from 'navigation/Navigation';

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
  expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Landscapes' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Groups' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
test('Navigation: Test initial', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes',
  });
  await setup();
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Landscapes' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Groups' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});
test('Navigation: Test select', async () => {
  useLocation.mockReturnValue({
    pathname: '/landscapes/landscape-slug',
  });
  await setup();
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Landscapes' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Groups' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});
test('Navigation: Test navigation', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  await setup();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Landscapes' }))
  );
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Landscapes' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
test('Navigation: none selected', async () => {
  useLocation.mockReturnValue({
    pathname: '/other',
  });
  await setup();
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Landscapes' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Groups' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});
