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
import React, { useMemo } from 'react';
import { useLocation } from 'react-router';

import { useBreadcrumbsParams } from '../breadcrumbsContext';
import Breadcrumbs from './Breadcrumbs';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}));

const TestComponent = () => {
  useBreadcrumbsParams(
    useMemo(() => ({ groupName: 'Group Name', loading: false }), [])
  );
  return <Breadcrumbs />;
};

const setup = async () => {
  await render(<TestComponent />);
};
test('Breadcrumbs: Dont Show items', async () => {
  useLocation.mockReturnValue({
    pathname: '/groups',
  });
  await setup();
  expect(
    screen.queryByRole('navigation', { name: 'Breadcrumbs' })
  ).not.toBeInTheDocument();
});
test('Breadcrumbs: Show items', async () => {
  useLocation.mockReturnValue({
    pathname: '/groups/group-1/members',
  });
  await setup();
  expect(
    screen.getByRole('navigation', { name: 'Breadcrumbs' })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'href',
    '/'
  );
  expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute(
    'href',
    '/groups'
  );
  expect(screen.getByRole('link', { name: 'Group Name' })).toHaveAttribute(
    'href',
    '/groups/group-1'
  );
  expect(screen.getByRole('link', { name: 'Members' })).toHaveAttribute(
    'href',
    '/groups/group-1/members'
  );
  expect(screen.getByRole('link', { name: 'Members' })).toHaveAttribute(
    'aria-current',
    'page'
  );
});
