import { render, screen } from 'tests/utils';

import React, { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import Breadcrumbs from './Breadcrumbs';
import { useBreadcrumbsParams } from './breadcrumbsContext';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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
