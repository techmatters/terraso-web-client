import { fireEvent, render, screen, within } from 'tests/utils';

import React from 'react';
import { act } from 'react-dom/test-utils';

import _ from 'lodash/fp';

import AccountProfile from 'account/components/AccountProfile';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('terrasoBackend/api');

const setup = async initialState => {
  await render(<AccountProfile />, initialState);
  const firstName = screen.getByRole('textbox', {
    name: 'Given names (Required)',
  });
  const lastName = screen.getByRole('textbox', { name: 'Family names' });
  return {
    inputs: {
      firstName,
      lastName,
    },
  };
};

test('AccountProfile: Display Avatar', async () => {
  await render(<AccountProfile />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          profileImage: 'test.com',
        },
      },
    },
  });
  expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument();
});

test('AccountProfile: Display Avatar with missing image', async () => {
  await render(<AccountProfile />, {
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          profileImage: '',
        },
      },
    },
  });
  expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument();
});

test('AccountProfile: Save', async () => {
  terrasoApi.request.mockResolvedValue(
    _.set(
      'updateUser.user',
      {
        id: '1',
        firstName: 'Pablo',
        lastName: 'Perez',
        email: 'group@group.org',
        profileImage: 'https://www.group.org/image.jpg',
        preferences: {
          language: 'es-ES',
        },
      },
      {}
    )
  );

  const { inputs } = await setup({
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
        },
      },
    },
  });

  fireEvent.change(inputs.firstName, { target: { value: 'Pablo' } });
  fireEvent.change(inputs.lastName, { target: { value: 'Perez' } });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);
  expect(terrasoApi.request.mock.calls[0][1]).toStrictEqual({
    input: {
      id: 'user-id',
      firstName: 'Pablo',
      lastName: 'Perez',
    },
  });
});
test('AccountProfile: Save language', async () => {
  terrasoApi.request.mockResolvedValueOnce(
    _.set(
      'updateUser.user',
      {
        id: '1',
        firstName: 'Pablo',
        lastName: 'Perez',
        email: 'group@group.org',
        profileImage: 'https://www.group.org/image.jpg',
        preferences: {
          language: 'es-ES',
        },
      },
      {}
    )
  );
  terrasoApi.request.mockResolvedValueOnce(
    _.set(
      'updateUserPreference.preference',
      { key: 'language', value: 'es-ES' },
      {}
    )
  );

  const { inputs } = await setup({
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
        },
      },
    },
  });

  fireEvent.change(inputs.firstName, { target: { value: 'Pablo' } });
  fireEvent.change(inputs.lastName, { target: { value: 'Perez' } });

  expect(screen.getByText('English')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('button', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(2);
  expect(terrasoApi.request.mock.calls[0][1]).toStrictEqual({
    input: {
      id: 'user-id',
      firstName: 'Pablo',
      lastName: 'Perez',
    },
  });
  expect(terrasoApi.request.mock.calls[1][1]).toStrictEqual({
    input: {
      key: 'language',
      userEmail: 'group@group.org',
      value: 'es-ES',
    },
  });
});
test('AccountProfile: Save error', async () => {
  terrasoApi.request.mockRejectedValueOnce('Save Error');

  const { inputs } = await setup({
    account: {
      hasToken: true,
      currentUser: {
        fetching: false,
        data: {
          id: 'user-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'group@group.org',
          profileImage: '',
        },
      },
    },
  });

  fireEvent.change(inputs.firstName, { target: { value: 'Pablo' } });
  fireEvent.change(inputs.lastName, { target: { value: 'Perez' } });

  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  );
  expect(terrasoApi.request).toHaveBeenCalledTimes(1);

  // Test error display
  expect(screen.getByText(/Save Error/i)).toBeInTheDocument();
});
