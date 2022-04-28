// prettier-ignore
import { render, screen } from 'tests/utils';

import Restricted from 'permissions/components/Restricted';
import React from 'react';

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
      permission: 'resource.action',
      children: <div>Restricted content</div>,
    },
    rules
  );
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
test('Restricted: Display fallback component', async () => {
  await setup({
    permission: 'resource.action',
    FallbackComponent: () => <div>Fallback content</div>,
    children: <div>Restricted content</div>,
  });
  expect(screen.queryByText('Restricted content')).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.getByText('Fallback content')).toBeInTheDocument();
});
