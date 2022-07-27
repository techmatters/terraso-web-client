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
        ref={navigationRef}
      >
        <button id="main-navigation-0">Nav 1</button>
      </Box>
      <Box component="main" ref={contentRef}>
        <h1 tabIndex="-1" id="main-heading">Main heading</h1>
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
  expect(screen.getByRole('heading', { name: 'Main heading'})).toHaveFocus();
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
  const navigation = screen.getByRole('navigation')
  expect(navigation).toHaveFocus();
});
