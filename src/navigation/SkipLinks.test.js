import { fireEvent, render, screen } from 'tests/utils';

import React, { useRef } from 'react';

import { act } from 'react-dom/test-utils';
import { useLocation } from 'react-router-dom';

import { Box } from '@mui/material';

import SkipLinks from 'navigation/SkipLinks';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();

  return (
    <>
      <SkipLinks contentRef={contentRef} navigationRef={navigationRef} />
      <Box
        component="nav"
        id="main-navigation"
        tabIndex="-1"
        ref={navigationRef}
      >
        Navigation
      </Box>
      <Box component="main" id="content" tabIndex="-1" ref={contentRef}>
        Content
      </Box>
    </>
  );
};

const setup = async () => {
  await render(<App />);
};

test('Navigation: Show links', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  await setup();
  expect(
    screen.getByRole('link', { name: 'Skip to main content' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Skip to main navigation' })
  ).toBeInTheDocument();
});
test('Navigation: Hide links for login page', async () => {
  useLocation.mockReturnValue({
    pathname: '/account',
  });
  await setup();
  expect(
    screen.queryByRole('link', { name: 'Skip to main content' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Skip to main navigation' })
  ).not.toBeInTheDocument();
});
test('Navigation: To content', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  await setup();
  expect(
    screen.getByRole('link', { name: 'Skip to main content' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Skip to main navigation' })
  ).toBeInTheDocument();

  expect(screen.getByRole('main')).not.toHaveFocus();
  await act(async () =>
    fireEvent.click(screen.getByRole('link', { name: 'Skip to main content' }))
  );
  expect(screen.getByRole('main')).toHaveFocus();
});
test('Navigation: To navigation', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  await setup();
  expect(
    screen.getByRole('link', { name: 'Skip to main content' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Skip to main navigation' })
  ).toBeInTheDocument();

  expect(screen.getByRole('navigation')).not.toHaveFocus();
  await act(async () =>
    fireEvent.click(
      screen.getByRole('link', { name: 'Skip to main navigation' })
    )
  );
  expect(screen.getByRole('navigation')).toHaveFocus();
});
