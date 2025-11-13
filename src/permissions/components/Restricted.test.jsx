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
import React from 'react';

import Restricted from 'permissions/components/Restricted';

const setup = async (props, rules) => {
  await render(
    <Restricted {...props} />,
    {
      account: {
        hasToken: true,
        currentUser: {
          fetching: false,
          data: {
            email: 'john.doe@email.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
    },
    rules
  );
};

test('Restricted: Display default loader', async () => {
  const rules = {
    'resource.action': () => new Promise(() => {}),
  };
  await setup(
    {
      resource: {},
      permission: 'resource.action',
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
test('Restricted: Display custom loader', async () => {
  const rules = {
    'resource.action': () => new Promise(() => {}),
  };
  await setup(
    {
      resource: {},
      permission: 'resource.action',
      LoadingComponent: () => <div>Loading...</div>,
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
test('Restricted: Display allowed component', async () => {
  const rules = {
    'resource.action': () => Promise.resolve(true),
  };
  await setup(
    {
      resource: {},
      permission: 'resource.action',
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.getByText('Restricted content')).toBeInTheDocument();
});
test('Restricted: Hide denied component', async () => {
  const rules = {
    'resource.action': () => Promise.resolve(false),
  };
  await setup(
    {
      resource: {},
      permission: 'resource.action',
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
test('Restricted: Display component for unallowed users', async () => {
  const rules = {
    'resource.action': () => Promise.resolve(false),
  };
  await setup(
    {
      resource: {},
      permission: 'resource.action',
      toDisallowedUsers: true,
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.getByText('Restricted content')).toBeInTheDocument();
});
test('Restricted: Hide component for allowed users', async () => {
  const rules = {
    'resource.action': () => Promise.resolve(true),
  };
  await setup(
    {
      resource: {},
      permission: 'resource.action',
      toDisallowedUsers: true,
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
test('Restricted: Display fallback component', async () => {
  await setup({
    resource: {},
    permission: 'resource.action',
    FallbackComponent: () => <div>Fallback content</div>,
    children: <div>Restricted content</div>,
  });
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByText('Fallback content')).toBeInTheDocument();
});
