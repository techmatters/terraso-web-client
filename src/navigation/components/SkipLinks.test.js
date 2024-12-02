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
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import PageHeader from 'layout/PageHeader';
import Navigation from 'navigation/components/Navigation';
import SkipLinks from 'navigation/components/SkipLinks';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const App = () => {
  const contentRef = useRef();
  const navigationRef = useRef();

  return (
    <>
      <SkipLinks contentRef={contentRef} navigationRef={navigationRef} />
      <Navigation />
      <PageHeader header="Main heading" />
    </>
  );
};

const setup = async () => {
  await render(<App />);
};

beforeEach(() => {
  useSelector.mockReturnValue(true);
});

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

  const skipToContent = screen.getByRole('link', {
    name: 'Skip to main content',
  });
  expect(skipToContent).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: 'Main heading',
    })
  ).toHaveAttribute('id', 'main-heading');

  expect(skipToContent).toHaveAttribute('href', '#main-heading');
});
test('Navigation: To navigation', async () => {
  useLocation.mockReturnValue({
    pathname: '/',
  });
  useSelector.mockReturnValue({
    data: true,
  });
  await setup();
  const skipToNavigation = screen.getByRole('link', {
    name: 'Skip to main navigation',
  });
  expect(skipToNavigation).toBeInTheDocument();
  expect(
    screen.getByRole('link', {
      name: 'Home',
    })
  ).toHaveAttribute('id', 'main-navigation-0');

  expect(skipToNavigation).toHaveAttribute('href', '#main-navigation-0');
});
